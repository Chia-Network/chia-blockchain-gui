import type CacheInfo from '../@types/CacheInfo';
import type Metadata from '../@types/Metadata';
import type MetadataState from '../@types/MetadataState';
import NFTPreviewStatus from '../@types/NFTPreviewStatus';
import CacheState from '../constants/CacheState';

import compareChecksums from './compareChecksums';
import { INACTIVITY_TIMEOUT_ERROR_PREFIX, isAbortedDownloadError } from './downloadErrors';
import { getIpfsPathFromAnyUrl, isIpfsBackedUrl, isIpfsUrl } from './ipfs';

export type NFTPreviewSource = {
  dataUris?: string[];
  dataHash?: string;
  // where the metadata — and with it the preview candidates — comes from
  metadataUris?: string[];
};

type PreviewCandidate = {
  uris?: string[];
  hash?: string;
};

// The sources a preview-mode tile verifies, in the priority order
// `selectNFTPreviewState` applies: preview video, preview image, data file.
// The preview candidates exist only once the metadata is known.
function getCandidates(nft: NFTPreviewSource, metadata: Metadata | undefined): PreviewCandidate[] {
  const candidates: PreviewCandidate[] = [];

  if (metadata) {
    candidates.push(
      { uris: metadata.preview_video_uris, hash: metadata.preview_video_hash },
      { uris: metadata.preview_image_uris, hash: metadata.preview_image_hash },
    );
  }

  candidates.push({ uris: nft.dataUris, hash: nft.dataHash });

  return candidates;
}

function settledMetadata(metadataState: MetadataState): Metadata | undefined {
  return metadataState.isLoading ? undefined : metadataState.metadata;
}

// How many uris of one source the classification consults. The uri arrays
// are minter-authored with no length cap, and every uri consulted is a file
// read in the main process (getCacheInfos) plus an entry in the renderer's
// memo of outcomes — so the sweep's cost per NFT has to be bounded by the
// wallet, not by whoever minted the NFT. A tile tries uris in order and stops
// at the first that verifies, so the first few decide the preview in practice;
// uris past the cap leave the NFT undecided rather than failed.
export const MAX_URIS_PER_CANDIDATE = 10;

// The uris of a source the classification consults: none without a hash to
// verify against, and at most MAX_URIS_PER_CANDIDATE otherwise.
function consultedUris(candidate: PreviewCandidate): string[] {
  // a list that is not one (unnormalized minter metadata) consults nothing
  return candidate.hash && Array.isArray(candidate.uris) ? candidate.uris.slice(0, MAX_URIS_PER_CANDIDATE) : [];
}

// The metadata uris the classification consults while the metadata is still
// being fetched (see isMetadataFetchDoomed), bounded like a source's.
function consultedMetadataUris(nft: NFTPreviewSource, metadataState: MetadataState): string[] {
  return metadataState.isLoading && Array.isArray(nft.metadataUris)
    ? nft.metadataUris.slice(0, MAX_URIS_PER_CANDIDATE)
    : [];
}

/** The urls whose cache state `getNFTPreviewStatusFromCache` consults. */
export function getNFTPreviewUrls(nft: NFTPreviewSource, metadataState: MetadataState): string[] {
  return [
    ...consultedMetadataUris(nft, metadataState),
    ...getCandidates(nft, settledMetadata(metadataState)).flatMap(consultedUris),
  ];
}

type UriOutcome = 'verified' | 'failed' | 'undecided';

function classifyUri(hash: string, cacheInfo: CacheInfo | undefined): UriOutcome {
  if (cacheInfo?.state === CacheState.CACHED) {
    // a cached file with the wrong checksum is a settled failure for this uri
    return cacheInfo.checksum && compareChecksums(cacheInfo.checksum, hash) ? 'verified' : 'failed';
  }

  return classifyFailure(cacheInfo);
}

// Whether a persisted outcome without a hash to check against — a metadata
// uri while its fetch is in flight — is a failure a tile asking for it would
// be served, by the same rules as classifyUri's. A cached file counts as
// verified: it is what the fetch will come back with.
function classifyFailure(cacheInfo: CacheInfo | undefined): UriOutcome {
  if (cacheInfo?.state === CacheState.CACHED) {
    return 'verified';
  }

  if (cacheInfo?.state === CacheState.ERROR) {
    // A download cancelled from our side is retried on the very next access
    // and settles nothing. Every other persisted failure — a transient one
    // (timeout, 5xx, rate limit, bot challenge, network error) as much as a
    // settled one (404, bad certificate) — is what a tile asking for the file
    // would be shown right now, so for the filter the preview is unavailable.
    // The cache keeps its own retry schedule: a tile that asks — in the
    // unavailable view, or in the unfiltered gallery — is served a retry when
    // one is due, and its live report replaces this verdict. Reading a due
    // retry as "undecided" here instead put every file whose hosts are gone
    // back under "Preview available" as soon as its delay ran out, where it
    // sat, unasked, until the user scrolled to it and watched it fail again.
    return isAbortedDownloadError(cacheInfo.error) ? 'undecided' : 'failed';
  }

  return 'undecided';
}

// An NFT commonly records the same file twice — an https gateway link and its
// ipfs:// twin. When the link fails on its own host and then through the
// gateway with an HTTP status or an inactivity timeout, CacheManager remembers
// the content as cold and refuses the ipfs:// twin — whose only route is that
// gateway — without a download and without a sidecar of its own
// (ColdIpfsPathError), so the twin never gets an outcome here. The ipfs paths
// (`<CID>[/path]`) of exactly those failures: a persisted HTTP-status or
// inactivity failure of a gateway link that classifies as failed. Not a hash
// mismatch (the content exists), not a network or deadline error (no verdict
// on the content), not a 429 (the cache puts the host on cooldown and still
// fetches the twin), and not a failed ipfs:// uri (a link's own host would
// still be tried).
const HTTP_STATUS_FAILURE = /^HTTP error: \d{3}$/;
const RATE_LIMITED = 'HTTP error: 429';

function failedIpfsPaths(
  uris: string[],
  getCacheInfo: (url: string) => CacheInfo | undefined,
  outcomeOf: (uri: string) => UriOutcome,
): Set<string> {
  const paths = new Set<string>();
  uris.forEach((uri) => {
    const cacheInfo = getCacheInfo(uri);
    const isGatewayLink = isIpfsBackedUrl(uri) && !isIpfsUrl(uri);
    const isContentFailure =
      cacheInfo?.state === CacheState.ERROR &&
      cacheInfo.error !== RATE_LIMITED &&
      (HTTP_STATUS_FAILURE.test(cacheInfo.error) || cacheInfo.error.startsWith(INACTIVITY_TIMEOUT_ERROR_PREFIX));
    if (isGatewayLink && isContentFailure && outcomeOf(uri) === 'failed') {
      const ipfsPath = getIpfsPathFromAnyUrl(uri);
      if (ipfsPath) {
        paths.add(ipfsPath);
      }
    }
  });
  return paths;
}

// A never-fetched ipfs:// uri naming content a gateway link of the same NFT
// failed to get (see failedIpfsPaths): a tile asking for it would be refused
// the same way, so it is read as failed too.
function isTwinOfFailure(uri: string, cacheInfo: CacheInfo | undefined, failedPaths: Set<string>): boolean {
  if (!isIpfsUrl(uri) || (cacheInfo !== undefined && cacheInfo.state !== CacheState.NOT_CACHED)) {
    return false;
  }
  const ipfsPath = getIpfsPathFromAnyUrl(uri);
  return ipfsPath !== undefined && failedPaths.has(ipfsPath);
}

// A metadata fetch still in flight whose every source the cache has already
// seen fail. The metadata
// store fetches every NFT's metadata on the first pass through the gallery,
// and for a file whose hosts are gone that fetch spends its whole budget
// (each uri's transfer deadline, in a queue full of the same) before it fails
// the same way it did last time; until then the NFT would count as undecided
// — undecided counts as available — and its tile would sit in "Preview
// available" showing the failure of its data file. Nothing settles here: the
// fetch runs on, and if it does bring the metadata the store's change
// notification has the NFT swept again with the preview candidates it brings.
function isMetadataFetchDoomed(
  nft: NFTPreviewSource,
  metadataState: MetadataState,
  getCacheInfo: (url: string) => CacheInfo | undefined,
): boolean {
  const uris = consultedMetadataUris(nft, metadataState);
  const outcomeOf = (uri: string) => classifyFailure(getCacheInfo(uri));
  const failedPaths = failedIpfsPaths(uris, getCacheInfo, outcomeOf);
  return (
    uris.length > 0 &&
    // every recorded copy, not just the consulted ones, must have been seen to fail
    uris.length === (nft.metadataUris?.length ?? 0) &&
    uris.every((uri) => outcomeOf(uri) === 'failed' || isTwinOfFailure(uri, getCacheInfo(uri), failedPaths))
  );
}

/**
 * Classifies an NFT's preview from what the cache already persisted about its
 * files, without fetching anything. Mirrors what a preview-mode tile settles
 * on: it walks the same sources `useNFTVerifyHash` verifies — preview video,
 * preview image, data file — and the first uri whose cached bytes match its
 * hash makes the preview available. The preview is unavailable only once
 * every uri of every source has a settled failure (a persisted download error
 * or cached bytes with the wrong checksum). Anything the cache has not seen
 * yet, or a download it aborted, leaves the outcome undecided (`undefined`),
 * as does metadata that is still loading (unless its fetch is doomed, see
 * isMetadataFetchDoomed): until it settles the preview sources are unknown,
 * and a thumbnail may still make the preview available even when the data
 * file itself is unreachable.
 */
export default function getNFTPreviewStatusFromCache(
  nft: NFTPreviewSource,
  metadataState: MetadataState,
  getCacheInfo: (url: string) => CacheInfo | undefined,
): NFTPreviewStatus | undefined {
  let isUndecided = metadataState.isLoading && !isMetadataFetchDoomed(nft, metadataState, getCacheInfo);

  for (const candidate of getCandidates(nft, settledMetadata(metadataState))) {
    // a source without a hash or uris has nothing to verify and contributes
    // nothing — it can neither make the preview available nor fail it
    const uris = consultedUris(candidate);
    if (candidate.hash && uris.length) {
      const { hash } = candidate;
      const failedPaths = failedIpfsPaths(uris, getCacheInfo, (uri) => classifyUri(hash, getCacheInfo(uri)));
      for (const uri of uris) {
        const cacheInfo = getCacheInfo(uri);
        const outcome = isTwinOfFailure(uri, cacheInfo, failedPaths) ? 'failed' : classifyUri(hash, cacheInfo);

        if (outcome === 'verified') {
          return NFTPreviewStatus.AVAILABLE;
        }

        if (outcome === 'undecided') {
          isUndecided = true;
        }
      }

      // uris past the cap were not consulted, so nothing is known about them:
      // the source cannot be called failed on the strength of the ones checked
      if ((candidate.uris?.length ?? 0) > uris.length) {
        isUndecided = true;
      }
    }
  }

  return isUndecided ? undefined : NFTPreviewStatus.UNAVAILABLE;
}

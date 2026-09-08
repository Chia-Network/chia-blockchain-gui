import type CacheInfo from '../@types/CacheInfo';
import type Metadata from '../@types/Metadata';
import type MetadataState from '../@types/MetadataState';
import NFTPreviewStatus from '../@types/NFTPreviewStatus';
import CacheState from '../constants/CacheState';

import compareChecksums from './compareChecksums';
import {
  REPEATED_TRANSIENT_FAILURES,
  isAbortedDownloadError,
  isTransientDownloadError,
  transientRetryDueAt,
} from './downloadErrors';
import { getIpfsPathFromAnyUrl } from './ipfs';

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

function classifyUri(hash: string, cacheInfo: CacheInfo | undefined, now: number): UriOutcome {
  if (cacheInfo?.state === CacheState.CACHED) {
    // a cached file with the wrong checksum is a settled failure for this uri
    return cacheInfo.checksum && compareChecksums(cacheInfo.checksum, hash) ? 'verified' : 'failed';
  }

  return classifyFailure(cacheInfo, now);
}

// Whether a persisted outcome without a hash to check against — a metadata
// uri while its fetch is in flight — is a failure a tile asking for it would
// be served, by the same rules as classifyUri's. A cached file counts as
// verified: it is what the fetch will come back with.
function classifyFailure(cacheInfo: CacheInfo | undefined, now: number): UriOutcome {
  if (cacheInfo?.state === CacheState.CACHED) {
    return 'verified';
  }

  if (cacheInfo?.state === CacheState.ERROR) {
    // A failure the cache will try again on the next access — an abort, or a
    // transient one (timeout, 5xx, rate limit, bot challenge, network error)
    // whose retry delay has passed — settles nothing: a tile that asked for
    // the file would fetch it, so calling the NFT unavailable would hide from
    // a filtered gallery a file that may well arrive. A transient failure
    // still inside its retry delay is what a tile would be served, so for now
    // the preview is unavailable — and the sweep looks again when the delay
    // runs out (getNFTPreviewRetryDueAt). One that has repeated
    // (REPEATED_TRANSIENT_FAILURES) stays unavailable until a tile gets the
    // file, and one that has exhausted its retries is settled for good.
    if (isAbortedDownloadError(cacheInfo.error)) {
      return 'undecided';
    }
    if (isTransientDownloadError(cacheInfo.error)) {
      if ((cacheInfo.retries ?? 0) >= REPEATED_TRANSIENT_FAILURES) {
        return 'failed';
      }
      const dueAt = transientRetryDueAt(cacheInfo);
      return dueAt !== undefined && dueAt <= now ? 'undecided' : 'failed';
    }
    return 'failed';
  }

  return 'undecided';
}

// The ipfs paths (`<CID>[/path]`) of the uris among `uris` whose outcome is a
// failure. An NFT commonly records the same file twice — a gateway link and
// its ipfs:// twin — and CacheManager refuses the twin of content the gateway
// just failed to produce without a download and without a sidecar of its own
// (ColdIpfsPathError), so the twin never gets an outcome here. A uri never
// fetched that names the same content as one that failed is read as failed
// too: a tile asking for it would be refused the same way.
function failedIpfsPaths(uris: string[], outcomeOf: (uri: string) => UriOutcome): Set<string> {
  const paths = new Set<string>();
  uris.forEach((uri) => {
    if (outcomeOf(uri) === 'failed') {
      const ipfsPath = getIpfsPathFromAnyUrl(uri);
      if (ipfsPath) {
        paths.add(ipfsPath);
      }
    }
  });
  return paths;
}

function isTwinOfFailure(uri: string, cacheInfo: CacheInfo | undefined, failedPaths: Set<string>): boolean {
  if (cacheInfo !== undefined && cacheInfo.state !== CacheState.NOT_CACHED) {
    return false;
  }
  const ipfsPath = getIpfsPathFromAnyUrl(uri);
  return ipfsPath !== undefined && failedPaths.has(ipfsPath);
}

// A metadata fetch still in flight whose every source the cache has already
// seen fail — and would serve that failure to a tile asking now. The metadata
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
  now: number,
): boolean {
  const uris = consultedMetadataUris(nft, metadataState);
  const outcomeOf = (uri: string) => classifyFailure(getCacheInfo(uri), now);
  const failedPaths = failedIpfsPaths(uris, outcomeOf);
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
 * yet, or failed only transiently, leaves the outcome undecided
 * (`undefined`), as does metadata that is still loading: until it settles the
 * preview sources are unknown, and a thumbnail may still make the preview
 * available even when the data file itself is unreachable.
 */
export default function getNFTPreviewStatusFromCache(
  nft: NFTPreviewSource,
  metadataState: MetadataState,
  getCacheInfo: (url: string) => CacheInfo | undefined,
  now: number = Date.now(),
): NFTPreviewStatus | undefined {
  let isUndecided = metadataState.isLoading && !isMetadataFetchDoomed(nft, metadataState, getCacheInfo, now);

  for (const candidate of getCandidates(nft, settledMetadata(metadataState))) {
    // a source without a hash or uris has nothing to verify and contributes
    // nothing — it can neither make the preview available nor fail it
    const uris = consultedUris(candidate);
    if (candidate.hash && uris.length) {
      const { hash } = candidate;
      const failedPaths = failedIpfsPaths(uris, (uri) => classifyUri(hash, getCacheInfo(uri), now));
      for (const uri of uris) {
        const cacheInfo = getCacheInfo(uri);
        const outcome = isTwinOfFailure(uri, cacheInfo, failedPaths) ? 'failed' : classifyUri(hash, cacheInfo, now);

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

/**
 * When an NFT classified unavailable may become undecided again: the earliest
 * time one of its consulted uris' first-time transient failures is retried on
 * access (see transientRetryDueAt), if any lies ahead of `now`. The sweep that
 * classified the NFT looks at it again then, so a file that failed once
 * during a gateway hiccup rejoins the gallery's available previews — and gets
 * its tile to ask for it — without the user having to visit the unavailable
 * ones. A failure that has repeated (REPEATED_TRANSIENT_FAILURES) earns no
 * such wake-up: its verdict holds until a tile gets the file.
 */
export function getNFTPreviewRetryDueAt(
  nft: NFTPreviewSource,
  metadataState: MetadataState,
  getCacheInfo: (url: string) => CacheInfo | undefined,
  now: number = Date.now(),
): number | undefined {
  let dueAt: number | undefined;
  const uriGroups = [
    // a metadata fetch the cache has seen fail: its first-time failures get a wake-up too
    consultedMetadataUris(nft, metadataState),
    // consultedUris is empty for a source without a hash
    ...getCandidates(nft, settledMetadata(metadataState)).map(consultedUris),
  ];
  for (const uris of uriGroups) {
    for (const uri of uris) {
      const cacheInfo = getCacheInfo(uri);
      if (
        cacheInfo?.state === CacheState.ERROR &&
        isTransientDownloadError(cacheInfo.error) &&
        (cacheInfo.retries ?? 0) < REPEATED_TRANSIENT_FAILURES
      ) {
        const uriDueAt = transientRetryDueAt(cacheInfo);
        if (uriDueAt !== undefined && uriDueAt > now && (dueAt === undefined || uriDueAt < dueAt)) {
          dueAt = uriDueAt;
        }
      }
    }
  }
  return dueAt;
}

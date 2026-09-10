import type CacheInfo from '../@types/CacheInfo';
import type Metadata from '../@types/Metadata';
import type MetadataState from '../@types/MetadataState';
import NFTPreviewStatus from '../@types/NFTPreviewStatus';
import CacheState from '../constants/CacheState';

import compareChecksums from './compareChecksums';
import { isAbortedDownloadError, isTransientDownloadError } from './downloadErrors';

export type NFTPreviewSource = {
  dataUris?: string[];
  dataHash?: string;
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
  return candidate.hash ? (candidate.uris ?? []).slice(0, MAX_URIS_PER_CANDIDATE) : [];
}

/** The urls whose cache state `getNFTPreviewStatusFromCache` consults. */
export function getNFTPreviewUrls(nft: NFTPreviewSource, metadataState: MetadataState): string[] {
  return getCandidates(nft, settledMetadata(metadataState)).flatMap(consultedUris);
}

type UriOutcome = 'verified' | 'failed' | 'undecided';

function classifyUri(hash: string, cacheInfo: CacheInfo | undefined): UriOutcome {
  if (cacheInfo?.state === CacheState.CACHED) {
    // a cached file with the wrong checksum is a settled failure for this uri
    return cacheInfo.checksum && compareChecksums(cacheInfo.checksum, hash) ? 'verified' : 'failed';
  }

  if (cacheInfo?.state === CacheState.ERROR) {
    // A failure the cache will try again — an abort on the next access, a
    // transient one (timeout, 5xx, rate limit, bot challenge, network error)
    // once its retry delay has passed — settles nothing: a tile that asked for
    // the file would fetch it. Calling the NFT unavailable here would hide it
    // from a filtered gallery, and a hidden tile never asks.
    return isAbortedDownloadError(cacheInfo.error) || isTransientDownloadError(cacheInfo.error)
      ? 'undecided'
      : 'failed';
  }

  return 'undecided';
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
): NFTPreviewStatus | undefined {
  let isUndecided = metadataState.isLoading;

  for (const candidate of getCandidates(nft, settledMetadata(metadataState))) {
    // a source without a hash or uris has nothing to verify and contributes
    // nothing — it can neither make the preview available nor fail it
    const uris = consultedUris(candidate);
    if (candidate.hash && uris.length) {
      for (const uri of uris) {
        const outcome = classifyUri(candidate.hash, getCacheInfo(uri));

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

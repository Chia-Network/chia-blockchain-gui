import type CacheInfo from '../@types/CacheInfo';
import type Metadata from '../@types/Metadata';
import type MetadataState from '../@types/MetadataState';
import NFTPreviewStatus from '../@types/NFTPreviewStatus';
import CacheState from '../constants/CacheState';

import compareChecksums from './compareChecksums';

// Persisted errors the cache retries on the next access, so a tile would try
// the download again — they do not settle a uri as failed.
const TRANSIENT_ERRORS = ['Response aborted', 'Request aborted'];

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

/** The urls whose cache state `getNFTPreviewStatusFromCache` consults. */
export function getNFTPreviewUrls(nft: NFTPreviewSource, metadataState: MetadataState): string[] {
  return getCandidates(nft, settledMetadata(metadataState)).flatMap((candidate) =>
    candidate.hash ? (candidate.uris ?? []) : [],
  );
}

type UriOutcome = 'verified' | 'failed' | 'undecided';

function classifyUri(hash: string, cacheInfo: CacheInfo | undefined): UriOutcome {
  if (cacheInfo?.state === CacheState.CACHED) {
    // a cached file with the wrong checksum is a settled failure for this uri
    return cacheInfo.checksum && compareChecksums(cacheInfo.checksum, hash) ? 'verified' : 'failed';
  }

  if (cacheInfo?.state === CacheState.ERROR) {
    return TRANSIENT_ERRORS.includes(cacheInfo.error) ? 'undecided' : 'failed';
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
    if (candidate.hash && candidate.uris?.length) {
      for (const uri of candidate.uris) {
        const outcome = classifyUri(candidate.hash, getCacheInfo(uri));

        if (outcome === 'verified') {
          return NFTPreviewStatus.AVAILABLE;
        }

        if (outcome === 'undecided') {
          isUndecided = true;
        }
      }
    }
  }

  return isUndecided ? undefined : NFTPreviewStatus.UNAVAILABLE;
}

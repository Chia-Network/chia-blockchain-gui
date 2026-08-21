import type CacheInfo from '../@types/CacheInfo';
import NFTPreviewStatus from '../@types/NFTPreviewStatus';
import CacheState from '../constants/CacheState';

import compareChecksums from './compareChecksums';

// Persisted errors the cache retries on the next access, so a tile would try
// the download again — they do not settle the preview as unavailable.
const TRANSIENT_ERRORS = ['Response aborted', 'Request aborted'];

export type NFTPreviewSource = {
  dataUris?: string[];
  dataHash?: string;
};

/**
 * Classifies an NFT's preview from what the cache already persisted about its
 * data URIs, without fetching anything. Mirrors the walk `useNFTVerifyHash`
 * performs when the tile is on screen: the first URI whose cached bytes match
 * the on-chain hash makes the preview available; the preview is unavailable
 * only once every URI has a settled failure (a persisted download error or a
 * cached file with the wrong checksum). A URI the cache has not seen yet — or
 * failed only transiently — leaves the outcome undecided (`undefined`), since
 * the tile would still attempt it.
 */
export default function getNFTPreviewStatusFromCache(
  nft: NFTPreviewSource,
  getCacheInfo: (url: string) => CacheInfo | undefined,
): NFTPreviewStatus | undefined {
  const { dataUris, dataHash } = nft;

  // nothing to verify against — the tile shows "No file available"
  if (!dataUris?.length || !dataHash) {
    return NFTPreviewStatus.UNAVAILABLE;
  }

  let isSettled = true;

  for (const uri of dataUris) {
    const cacheInfo = getCacheInfo(uri);

    if (cacheInfo?.state === CacheState.CACHED) {
      if (cacheInfo.checksum && compareChecksums(cacheInfo.checksum, dataHash)) {
        return NFTPreviewStatus.AVAILABLE;
      }
      // a cached file with the wrong checksum is a settled failure for this uri
    } else if (cacheInfo?.state === CacheState.ERROR) {
      if (TRANSIENT_ERRORS.includes(cacheInfo.error)) {
        isSettled = false;
      }
    } else {
      isSettled = false;
    }
  }

  return isSettled ? NFTPreviewStatus.UNAVAILABLE : undefined;
}

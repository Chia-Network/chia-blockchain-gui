import type NFTInfo from '@chia/api';
import { useLocalStorage } from '@chia/api-react';
import { useEffect, useState, useCallback } from 'react';

import { eventEmitter } from '../components/nfts/NFTContextualActions';
import getRemoteFileContent from '../util/getRemoteFileContent';

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export const lruMap = new Map();

(window as any).lru_map = lruMap;

export function lruGet(key: string) {
  const value = lruMap.get(key);
  if (value) {
    lruMap.delete(key);

    lruMap.set(key, value);
  }

  return value;
}

export function lruSet(key: string, value: any) {
  if (lruMap.size >= 2000) {
    // delete oldest entry
    lruMap.delete(lruMap.keys().next().value);
  }
  lruMap.set(key, value);
}

export function getMetadataObject(nftId) {
  let parsedMetadataObject = {};
  try {
    // ============= TRY MEMORY CACHE FIRST ============== //
    const lru = lruGet(nftId);
    if (lru) {
      if (typeof lru === 'object') {
        lruMap.delete(nft.$nftId);
      } else {
        parsedMetadataObject = JSON.parse(lru);
      }
    } else {
      // ============= TRY LOCALSTORAGE CACHE SECOND ============== //
      const lsCache = localStorage.getItem(`metadata-cache-${nft.$nftId}`);
      if (lsCache) {
        parsedMetadataObject = JSON.parse(lsCache);
      }
    }
  } catch (e) {}
  return parsedMetadataObject;
}

export default function useNFTsMetadata(nfts: NFTInfo[]) {
  const nft = nfts[0];
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorContent, setErrorContent] = useState<Error | undefined>();
  const [metadata, setMetadata] = useState<any>();

  async function getMetadata(nft) {
    setIsLoading(true);
    const { metadataHash } = nft;
    const uri = nft?.metadataUris?.[0];
    const nftId = nft?.$nftId;

    const metadataObject = getMetadataObject(nftId);

    if (metadataObject.isValid) {
      setMetadata(metadataObject.metadata);
      setIsLoading(false);
      return;
    }

    // ============== OTHERWISE FETCH DATA FROM INTERNET =========== //
    let metadata;
    setErrorContent(undefined);
    try {
      if (!uri) {
        setIsLoading(false);
        throw new Error('Invalid URI');
      }

      const {
        data: content,
        encoding,
        isValid,
      } = await getRemoteFileContent({
        nftId,
        uri,
        maxSize: MAX_FILE_SIZE,
        dataHash: metadataHash,
      });

      if (!isValid) {
        setErrorContent(new Error('Metadata hash mismatch'));
        lruSet(nftId, JSON.stringify({ isValid: false }));
      }

      if (['utf8', 'utf-8'].includes(encoding.toLowerCase())) {
        metadata = JSON.parse(content);
      } else {
        // Special case where we don't know the encoding type -- assume UTF-8
        metadata = JSON.parse(Buffer.from(content, encoding as BufferEncoding).toString('utf8'));
      }
    } catch (error: any) {
      const errorStringified = JSON.stringify({
        isValid: false,
      });
      lruSet(nftId, errorStringified);
      localStorage.setItem(`metadata-cache-${nft.$nftId}`, errorStringified);
      setErrorContent(error);
    }
    if (metadata) {
      setMetadata(metadata);
      const stringifiedCacheObject = JSON.stringify({
        metadata,
        isValid: true,
      });
      lruSet(nftId, stringifiedCacheObject);
      localStorage.setItem(`metadata-cache-${nft.$nftId}`, stringifiedCacheObject);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    getMetadata(nft);
  }, [nft]);

  function loadReload() {
    getMetadata(nft);
  }

  useEffect(() => {
    if (nft) {
      eventEmitter.on(`force-reload-metadata-${nft.$nftId}`, loadReload);
      return () => {
        eventEmitter.off(`force-reload-metadata-${nft.$nftId}`, loadReload);
      };
    }
  }, [nft]);

  return {
    metadata,
    isLoading,
    error: errorContent,
  };
}

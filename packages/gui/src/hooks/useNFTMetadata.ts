import type NFTInfo from '@chia-network/api';
import type LRU from '@chia-network/core';
import { useEffect, useState, useCallback } from 'react';

import { eventEmitter } from '../components/nfts/NFTContextualActions';
import getRemoteFileContent from '../util/getRemoteFileContent';
import useNFTMetadataLRU from './useNFTMetadataLRU';

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export function getMetadataObject(nftId: string, lru: LRU<string, any>): any {
  let parsedMetadataObject = {};
  try {
    // ============= TRY MEMORY CACHE FIRST ============== //
    const cached = lru.get(nftId);
    if (cached) {
      if (typeof cached === 'object') {
        lru.delete(nftId);
      } else {
        parsedMetadataObject = JSON.parse(cached);
      }
    } else {
      // ============= TRY LOCALSTORAGE CACHE SECOND ============== //
      const lsCache = localStorage.getItem(`metadata-cache-${nftId}`);
      lru.set(nftId, lsCache);
      if (lsCache) {
        parsedMetadataObject = JSON.parse(lsCache);
      }
    }
  } catch (e) {
    /* todo */
  }

  return parsedMetadataObject;
}

export default function useNFTsMetadata(nfts: NFTInfo[]) {
  const nft = nfts[0];
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorContent, setErrorContent] = useState<string | undefined>();
  const [metadata, setMetadata] = useState<any>();
  const lru = useNFTMetadataLRU();

  const getMetadata = useCallback(
    async (nftObject: NFTInfo) => {
      setIsLoading(true);
      setErrorContent(undefined);
      const { metadataHash } = nftObject;
      const uri = nftObject?.metadataUris?.[0];
      const nftId = nftObject?.$nftId;

      const metadataObject = getMetadataObject(nftId, lru);

      if (metadataObject.error) {
        setErrorContent(metadataObject.error);
        setIsLoading(false);
        return;
      }
      if (metadataObject.isValid) {
        setMetadata(metadataObject.metadata);
        setIsLoading(false);
        return;
      }

      // ============== OTHERWISE FETCH DATA FROM INTERNET =========== //
      let metadataContent;
      try {
        if (!uri) {
          setIsLoading(false);
          return;
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
          timeout: 2000,
        });

        if (!isValid) {
          setErrorContent('Metadata hash mismatch');
          lru.set(nftId, JSON.stringify({ isValid: false }));
        }

        if (['utf8', 'utf-8'].includes(encoding.toLowerCase())) {
          metadataContent = JSON.parse(content);
        } else {
          // Special case where we don't know the encoding type -- assume UTF-8
          metadataContent = JSON.parse(Buffer.from(content, encoding as BufferEncoding).toString('utf8'));
        }
      } catch (error: any) {
        const errorStringified = JSON.stringify({
          isValid: false,
          error: 'Invalid URI',
        });
        lru.set(nftId, errorStringified);
        localStorage.setItem(`metadata-cache-${nft.$nftId}`, errorStringified);
        setErrorContent('Invalid URI');
      }
      if (metadataContent) {
        setMetadata(metadataContent);
        const stringifiedCacheObject = JSON.stringify({
          metadata: metadataContent,
          isValid: true,
        });
        lru.set(nftId, stringifiedCacheObject);
        localStorage.setItem(`metadata-cache-${nft.$nftId}`, stringifiedCacheObject);
      }
      setIsLoading(false);
    },
    [lru, nft.$nftId]
  );

  useEffect(() => {
    if (nft) {
      getMetadata(nft);
    }
  }, [nft, getMetadata]);

  const loadReload = useCallback(() => {
    setErrorContent(undefined);
    getMetadata(nft);
  }, [nft, getMetadata]);

  useEffect(() => {
    if (nft) {
      eventEmitter.on(`force-reload-metadata-${nft.$nftId}`, loadReload);
    }
    return () => {
      if (nft) {
        eventEmitter.off(`force-reload-metadata-${nft.$nftId}`, loadReload);
      }
    };
  }, [nft, loadReload]);

  return {
    metadata,
    isLoading,
    error: errorContent,
  };
}

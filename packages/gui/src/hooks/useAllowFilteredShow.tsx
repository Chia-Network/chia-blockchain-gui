import type NFTInfo from '@chia-network/api';
import type LRU from '@chia-network/core';
import React, { useEffect, useState, useCallback } from 'react';

import getRemoteFileContent from '../util/getRemoteFileContent';
import { getMetadataObject } from './useNFTMetadata';
import useNFTMetadataLRU from './useNFTMetadataLRU';

const concurrentCount = 50;

async function getMetadata(nft: NFTInfo | undefined, lru: LRU<string, any>) {
  const uri = nft?.metadataUris?.[0];
  const nftId = nft?.$nftId;
  const { metadataHash } = nft;

  /* Try cache first */
  const metadataObject = getMetadataObject(nftId, lru);

  if (Object.keys(metadataObject).length) {
    return { ...nft, nftId, metadata: metadataObject.metadata };
  }

  let metadata;
  try {
    if (!uri) {
      throw new Error('Invalid URI');
    }

    const {
      data: content,
      encoding,
      isValid,
    } = await getRemoteFileContent({
      nftId,
      uri,
      dataHash: metadataHash,
      timeout: 30_000,
    });

    if (!isValid) {
      lru.set(nftId, JSON.stringify({ isValid: false }));
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
    lru.set(nftId, errorStringified);
    localStorage.setItem(`metadata-cache-${nft.$nftId}`, errorStringified);
  }
  if (metadata) {
    const stringifiedCacheObject = JSON.stringify({
      metadata,
      isValid: true,
    });
    lru.set(nftId, stringifiedCacheObject);
    localStorage.setItem(`metadata-cache-${nft.$nftId}`, stringifiedCacheObject);
  }
  return { ...nft, metadata };
}

export default function useAllowFilteredShow(nfts: NFTInfo[], hideObjectionableContent: boolean, isLoading: boolean) {
  const [allowNFTsFiltered, setAllowNFTsFiltered] = useState<NFTInfo[]>([]);
  const [isGettingMetadata, setIsGettingMetadata] = useState(true);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const nftArray = React.useRef<NFTInfo[]>([]);
  const lru = useNFTMetadataLRU();

  const nftsLengthOld = React.useRef(0);

  const fetchMultipleMetadata = useCallback(async () => {
    /* eslint no-await-in-loop: off -- all network requests shouldn't be executed in parallel so we will be
      "for looping" 50 requests in parallel (concurrentCount variable defaults to 50) so that way if we had any
       metadata request timeouts (default 2s), then the first 50 NFTs will get their metadata in this 2s and in
       the worst case we will be rendering first 50 NFTs 2 seconds after than we get them from BE - of course,
       this 2s wait will only happen if metadata is not cached already, if it's cached, then there will be no waiting
    */
    nftArray.current = [];
    for (let i = 0; i < Math.ceil(nfts.length / concurrentCount); i++) {
      const tempCount =
        i === Math.ceil(nfts.length / concurrentCount) - 1 ? nfts.length % concurrentCount : concurrentCount;
      const partialResults = await Promise.all(
        Array.from(Array(tempCount).keys()).map((n) => getMetadata(nfts[n + i * concurrentCount], lru))
      );
      partialResults.forEach((nftWithMetadata) => {
        if (
          !hideObjectionableContent ||
          !nftWithMetadata?.metadata ||
          (nftWithMetadata?.metadata &&
            (!nftWithMetadata?.metadata.sensitive_content ||
              nftWithMetadata?.metadata.sensitive_content === false ||
              nftWithMetadata?.metadata.sensitive_content === 'false'))
        ) {
          nftArray.current = nftArray.current.concat(nftWithMetadata);
        }
      });
      setAllowNFTsFiltered(nftArray.current);
      setIsLoadingState(false);
    }
    if (nftArray.current.length === 0) {
      setAllowNFTsFiltered([]);
    }
    setIsGettingMetadata(false);
  }, [hideObjectionableContent, lru, nfts]);

  useEffect(() => {
    if (!isLoading) {
      fetchMultipleMetadata();
      nftsLengthOld.current = nfts.length;
    }
  }, [isLoading, nfts.length, fetchMultipleMetadata]);

  return { allowNFTsFiltered, isDoneLoadingAllowedNFTs: !isGettingMetadata, isLoading: isLoadingState };
}

import type NFTInfo from '@chia-network/api';
import type LRU from '@chia-network/core';
import React, { useEffect, useState, useCallback } from 'react';

import getRemoteFileContent from '../util/getRemoteFileContent';
import { getMetadataObject } from './useNFTMetadata';
import useNFTMetadataLRU from './useNFTMetadataLRU';

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
      timeout: 2000,
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
  return { ...nft, nftId: nft?.$nftId, metadata };
}

export default function useAllowFilteredShow(nfts: NFTInfo[], hideObjectionableContent: boolean, isLoading: boolean) {
  const [allowNFTsFiltered, setAllowNFTsFiltered] = useState<NFTInfo[]>([]);
  const [isGettingMetadata, setIsGettingMetadata] = useState(true);
  const nftArray = React.useRef<NFTInfo[]>([]);
  const lru = useNFTMetadataLRU();

  const nftsLengthOld = React.useRef(0);

  /* eslint no-await-in-loop: off -- cannot be executed in parallel, because of too many network requests,
     todo: optimize to have a loop of 50 parallel requests */
  const fetchMultipleMetadata = useCallback(async () => {
    nftArray.current = [];
    for (let i = 0; i < nfts.length; i++) {
      const nftWithMetadata: any = (await getMetadata(nfts[i], lru)) || { nftId: nfts[i]?.$nftId };
      if (
        !hideObjectionableContent ||
        !nftWithMetadata?.metadata ||
        (nftWithMetadata?.metadata && !nftWithMetadata?.metadata.sensitive_content)
      ) {
        nftArray.current = nftArray.current.concat(nftWithMetadata);
        /* compromise - rerender gallery only every 10% of the size of your whole collection */
        if (i % (Math.floor(nfts.length / 10) + 1) === 0 && i > 0) {
          setAllowNFTsFiltered(nftArray.current);
        }
      }
    }
    setAllowNFTsFiltered(nftArray.current);
    setIsGettingMetadata(false);
  }, [hideObjectionableContent, lru, nfts]);

  useEffect(() => {
    if (nfts.length && !isLoading && nfts.length !== nftsLengthOld.current) {
      fetchMultipleMetadata();
      nftsLengthOld.current = nfts.length;
    }
  }, [isLoading, nfts.length, fetchMultipleMetadata]);

  return { allowNFTsFiltered, isDoneLoadingAllowedNFTs: !isGettingMetadata };
}

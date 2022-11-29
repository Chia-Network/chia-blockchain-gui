import type NFTInfo from '@chia/api';
import React, { useEffect, useState } from 'react';

import getRemoteFileContent from '../util/getRemoteFileContent';
import { lruSet, getMetadataObject } from './useNFTMetadata';

async function getMetadata(nft) {
  const uri = nft?.metadataUris?.[0];
  const nftId = nft?.$nftId;
  const { metadataHash } = nft;

  /* Try cache first */
  const metadataObject = getMetadataObject(nftId);

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
    });

    if (!isValid) {
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
  }
  if (metadata) {
    const stringifiedCacheObject = JSON.stringify({
      metadata,
      isValid: true,
    });
    lruSet(nftId, stringifiedCacheObject);
    localStorage.setItem(`metadata-cache-${nft.$nftId}`, stringifiedCacheObject);
  }
  return { nftId: nft?.$nftId, metadata };
}

export default function useAllowFilteredShow(nfts: NFTInfo[], hideObjectionableContent: boolean, isLoading: boolean) {
  const [allowNFTsFiltered, setAllowNFTsFiltered] = useState<NFTInfo[]>([]);

  const nftArray = React.useRef<NFTInfo[]>([]);

  const fetchMultipleMetadata = async () => {
    nftArray.current = [];
    for (let i = 0; i < nfts.length; i++) {
      const nftWithMetadata: any = (await getMetadata(nfts[i])) || { nftId: nfts[i]?.$nftId };
      if (
        !hideObjectionableContent ||
        !nftWithMetadata?.metadata ||
        (nftWithMetadata?.metadata && !nftWithMetadata?.metadata.sensitive_content)
      ) {
        nftArray.current = nftArray.current.concat(nftWithMetadata);
        setAllowNFTsFiltered(nftArray.current);
      }
    }
  };

  useEffect(() => {
    if (nfts.length && !isLoading) {
      fetchMultipleMetadata();
    }
  }, [nfts[0], isLoading]);

  return { allowNFTsFiltered };
}

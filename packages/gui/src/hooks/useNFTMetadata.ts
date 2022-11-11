import { useEffect, useState, useCallback } from 'react';
import type NFTInfo from '@chia/api';
import getRemoteFileContent from '../util/getRemoteFileContent';
import { useLocalStorage } from '@chia/api-react';

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

function normalizedSensitiveContent(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  } else if (Array.isArray(value) && value.length > 0) {
    return true;
  }
  return value === 'true';
}

export default function useNFTsMetadata(nfts: NFTInfo[], isMultiple = false) {
  const nft = nfts[0];
  const nftId = nft?.$nftId;
  const [isLoading, setIsLoadingContent] = useState<boolean>(true);
  const [errorContent, setErrorContent] = useState<Error | undefined>();
  const [metadata, setMetadata] = useState<any>();
  const [allowedNFTsWithMetadata] = useState<NFTInfo[]>([]);

  const [metadataCache, setMetadataCache] = useLocalStorage(
    `metadata-cache-${nftId}`,
    {},
  );

  const [sensitiveContentObject, setSensitiveContentObject] = useLocalStorage(
    'sensitive-content',
    {},
  );

  function setSensitiveContent(nftId: string, metadata: Record<string, any>) {
    try {
      const sensitiveContentValue = normalizedSensitiveContent(
        metadata.sensitive_content,
      );

      if (sensitiveContentValue) {
        setSensitiveContentObject(
          Object.assign({}, sensitiveContentObject, { [nftId]: true }),
        );
      }
    } catch (e) {
      // Do nothing
    }
  }

  async function getMetadataContents({ dataHash, nftId, uri }): Promise<{
    data: string;
    encoding: string;
    isValid: boolean;
  }> {
    if (isMultiple) {
      let obj;
      let metadata;
      const cachedMetadata = localStorage.getItem(`metadata-cache-${nftId}`);
      try {
        if (cachedMetadata) {
          obj = JSON.parse(cachedMetadata);
          metadata = JSON.parse(obj.json);
        }
      } catch (e) {
        // Do nothing
      }
      if (
        isMultiple &&
        metadata &&
        !normalizedSensitiveContent(metadata.sensitive_content)
      ) {
        allowedNFTsWithMetadata.push(nftId);
      }
    } else {
      if (metadataCache?.isValid !== undefined) {
        return {
          data: metadataCache.json,
          encoding: 'utf-8',
          isValid: metadataCache.isValid,
        };
      }
    }

    return await getRemoteFileContent({
      nftId,
      uri,
      maxSize: MAX_FILE_SIZE,
      dataHash,
    });
  }

  const getMetadata = useCallback(async (nft) => {
    const uri = nft?.metadataUris?.[0];
    const nftId = nft?.$nftId;
    try {
      setIsLoadingContent(true);
      setErrorContent(undefined);
      setMetadata(undefined);

      if (!uri) {
        throw new Error('Invalid URI');
      }

      const {
        data: content,
        encoding,
        isValid,
      } = await getMetadataContents({ dataHash: nft.metadataHash, nftId, uri });

      if (!isValid && !isMultiple) {
        setMetadataCache({
          isValid: false,
        });
        throw new Error('Metadata hash mismatch');
      }

      let metadata = undefined;
      if (['utf8', 'utf-8'].includes(encoding.toLowerCase())) {
        metadata = JSON.parse(content);
      } else {
        // Special case where we don't know the encoding type -- assume UTF-8
        metadata = JSON.parse(
          Buffer.from(content, encoding as BufferEncoding).toString('utf8'),
        );
      }
      if (!isMultiple) {
        const utf8Metadata = JSON.stringify(metadata);
        setMetadataCache({
          isValid: true,
          json: utf8Metadata,
        });
      }
      setMetadata(metadata);
      setSensitiveContent(nftId, metadata);
      if (
        isMultiple &&
        !normalizedSensitiveContent(metadata.sensitive_content)
      ) {
        allowedNFTsWithMetadata.push(nftId);
      }
    } catch (error: any) {
      setErrorContent(error);
      if (isMultiple) {
        allowedNFTsWithMetadata.push(nftId);
      }
    } finally {
      setIsLoadingContent(false);
    }
  }, []);

  useEffect(() => {
    if (isMultiple) {
      for (let i = 0; i < nfts.length; i++) {
        getMetadata(nfts[i]);
      }
    } else if (nft) {
      getMetadata(nft);
    }
  }, [nft]);

  const error = errorContent;

  return {
    metadata,
    isLoading,
    error,
    allowedNFTsWithMetadata,
  };
}

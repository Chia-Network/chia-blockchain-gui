import type { NFTInfo } from '@chia-network/api';
import { useState, useEffect, useRef } from 'react';
import isURL from 'validator/lib/isURL';

import computeHash from '../util/computeHash';
import getRemoteFileContent, { FileType } from '../util/getRemoteFileContent';
import { mimeTypeRegex, isImage, parseExtensionFromUrl } from '../util/utils';
import useNFTMetadata, { MAX_FILE_SIZE } from './useNFTMetadata';

const { ipcRenderer } = window as any;

function isAudio(uri: string) {
  return mimeTypeRegex(uri, /^audio/);
}

type VerifyHash = {
  nft: NFTInfo;
  ignoreSizeLimit: boolean;
  isPreview: boolean;
  dataHash: string;
  nftId: string;
  validateNFT: boolean;
  setNFTCardMetadata?: () => void;
};

let encoding: string = 'binary';

export default function useVerifyHash(props: VerifyHash): {
  isLoading: boolean;
  error: string | undefined;
  thumbnail: any;
  isValidationProcessed: boolean;
  validateNFT: boolean;
  encoding: string;
  isValid: boolean;
} {
  const { nft, ignoreSizeLimit, isPreview, dataHash, nftId, validateNFT, setNFTCardMetadata } = props;
  const [isValidationProcessed, setIsValidationProcessed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [thumbnail, setThumbnail] = useState({});

  const { metadata, isLoading: isLoadingMetadata, error: metadataError } = useNFTMetadata([nft]);

  const hashIsValid = useRef(false);

  const uri = nft.dataUris?.[0];

  let lastError: any;

  function getCacheItem(key: string) {
    let cacheObject;
    try {
      const cacheString = localStorage.getItem(key) || '';
      cacheObject = JSON.parse(cacheString);
    } catch (e) {
      cacheObject = {};
    }
    return cacheObject;
  }

  function setCacheItem(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  async function validateHash(): Promise<void> {
    let uris: string[] = [];
    let videoThumbValid: boolean = false;
    let imageThumbValid: boolean = false;

    setError(undefined);
    setIsLoading(true);

    const thumbCache = getCacheItem(`thumb-cache-${nftId}`);
    const contentCache = getCacheItem(`content-cache-${nftId}`);

    if (metadata?.preview_video_uris && !metadata.preview_video_hash) {
      setIsLoading(false);
      lastError = 'missing preview_video_hash';
    } else if (metadata?.preview_image_uris && !metadata.preview_image_hash) {
      setIsLoading(false);
      lastError = 'missing preview_image_hash';
    } else {
      if (thumbCache.error) {
        setIsLoading(false);
        setError(contentCache.error);
      } else if (metadata?.preview_video_uris) {
        /* ================== VIDEO THUMBNAIL ================== */
        /* if it's cached, don't try to validate hash at all */
        if (thumbCache.video) {
          setThumbnail({
            video: `cached://${thumbCache.video}`,
          });
          setIsLoading(false);
          videoThumbValid = true;
          return;
        }
        uris = metadata.preview_video_uris;
        for (let i = 0; i < uris.length; i += 1) {
          const videoUri = uris[i];
          try {
            if (!isURL(videoUri)) {
              lastError = 'Invalid URI';
            }
            const { isValid, wasCached } = await getRemoteFileContent({
              uri: videoUri,
              forceCache: true,
              nftId,
              type: FileType.Video,
              dataHash: metadata.preview_video_hash,
            });

            if (!isValid) {
              lastError = 'thumbnail hash mismatch';
              setCacheItem(`thumb-cache-${nftId}`, {
                error: lastError,
              });
            }
            if (isValid) {
              videoThumbValid = true;
              const cachedUri = `${nftId}_${videoUri}`;
              setThumbnail({
                video: wasCached
                  ? `cached://${computeHash(cachedUri, {
                      encoding: 'utf-8',
                    })}`
                  : videoUri,
              });
              if (wasCached) {
                setCacheItem(`thumb-cache-${nftId}`, {
                  video: computeHash(cachedUri, { encoding: 'utf-8' }),
                  time: new Date().getTime(),
                });
              }
              setIsLoading(false);
              lastError = null;
              break;
            }
          } catch (e: any) {
            /* if we already found content that is hash mismatched, show mismatch error! */
            lastError = lastError || 'failed fetch content';
          }
        }
      }

      /* ================== IMAGE THUMBNAIL ================== */
      if (metadata?.preview_image_uris && !videoThumbValid && !thumbCache.error) {
        uris = metadata.preview_image_uris;
        for (let i = 0; i < uris.length; i++) {
          const imageUri = uris[i];
          /* if it's cached, don't try to validate hash at all */
          if (thumbCache.image) {
            lastError = null;
            setThumbnail({
              image: `cached://${thumbCache.image}`,
            });
            setIsLoading(false);
            imageThumbValid = true;
            break;
          }
          try {
            if (!isURL(imageUri)) {
              lastError = 'Invalid URI';
            }
            const { wasCached, isValid } = await getRemoteFileContent({
              uri: imageUri,
              forceCache: true,
              nftId,
              dataHash: metadata.preview_image_hash,
              type: FileType.Image,
            });
            if (!isValid) {
              lastError = 'thumbnail hash mismatch';
              setCacheItem(`thumb-cache-${nftId}`, {
                error: lastError,
              });
            }
            if (isValid) {
              imageThumbValid = true;
              const cachedImageUri = `${nftId}_${imageUri}`;
              if (wasCached) {
                setCacheItem(`thumb-cache-${nftId}`, {
                  image: computeHash(cachedImageUri, { encoding: 'utf-8' }),
                  time: new Date().getTime(),
                });
              }
              setThumbnail({
                image: wasCached
                  ? `cached://${computeHash(cachedImageUri, {
                      encoding: 'utf-8',
                    })}`
                  : imageUri,
              });
              setIsLoading(false);
              break;
            }
          } catch (e: any) {
            /* if we already found content that is hash mismatched, show mismatch error! */
            lastError = lastError || 'failed fetch content';
          }
        }
      }

      /* ================== BINARY CONTENT ================== */

      if (isImage(uri) || !isPreview || isAudio(uri)) {
        if (contentCache.valid !== undefined && contentCache.binary) {
          hashIsValid.current = contentCache.valid;
          if (parseExtensionFromUrl(uri) === 'svg') {
            const svgContent = await ipcRenderer.invoke('getSvgContent', contentCache.binary);
            if (svgContent) {
              setThumbnail({
                binary: svgContent,
              });
              if (contentCache.valid === false) {
                lastError = lastError || 'Hash mismatch';
              }
            }
          } else {
            const thumbnailExists = videoThumbValid || imageThumbValid;
            checkBinaryCache({ lastError, thumbnailExists });
          }
        } else {
          let dataContent;
          try {
            const {
              data,
              encoding: fileEncoding,
              wasCached,
              isValid,
            } = await getRemoteFileContent({
              uri,
              maxSize: ignoreSizeLimit || validateNFT ? Infinity : MAX_FILE_SIZE,
              forceCache: true,
              nftId,
              type: FileType.Binary,
              dataHash,
            });

            dataContent = data;

            const cachedBinaryUri = `${nftId}_${uri}`;

            setCacheItem(`content-cache-${nftId}`, {
              nftId,
              binary: wasCached ? computeHash(cachedBinaryUri, { encoding: 'utf-8' }) : null,
              valid: isValid,
              time: new Date().getTime(),
            });

            encoding = fileEncoding;

            hashIsValid.current = isValid;

            if (!isValid) {
              lastError = lastError || 'Hash mismatch';
            }
          } catch (e: any) {
            lastError = lastError || e.message;
          }

          /* show binary content even though the hash is mismatched! */
          if (!lastError || lastError === 'Hash mismatch') {
            if (parseExtensionFromUrl(uri) === 'svg' && dataContent) {
              setThumbnail({
                binary: dataContent,
              });
            }
          }
        }
      }
    }
    if (lastError) {
      setError(lastError);
    }
    setIsLoading(false);
    setIsValidationProcessed(true);
  }

  function checkBinaryCache({ lastError, thumbnailExists }) {
    const contentCache = getCacheItem(`content-cache-${nftId}`);
    if (contentCache.binary) {
      if (!thumbnailExists) {
        setIsLoading(false);
        setThumbnail({
          binary: `cached://${contentCache.binary}`,
        });
      }
      if (contentCache.valid === false) {
        lastError = lastError || 'Hash mismatch';
      }
    }
  }

  function loadReload() {
    if (!isLoadingMetadata) {
      if (metadata && Object.keys(metadata).length > 0 && !metadataError && (isPreview || isAudio(uri))) {
        validateHash();
      } else if (isImage(uri) || validateNFT || isAudio(uri)) {
        validateHash();
      } else if (!isPreview) {
        checkBinaryCache({ lastError: null, thumbnailExists: false });
      } else {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    loadReload();
  }, [uri, ignoreSizeLimit, validateNFT, metadata, isLoadingMetadata]);

  useEffect(() => {
    if (metadata && setNFTCardMetadata) {
      setNFTCardMetadata(metadata);
    }
  }, [metadata]);

  return {
    isLoading: isPreview ? isLoading : false,
    error,
    thumbnail,
    isValidationProcessed,
    validateNFT,
    encoding,
    isValid: hashIsValid.current,
  };
}

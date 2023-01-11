/* eslint-disable import/no-cycle -- disable */
import type { NFTInfo } from '@chia-network/api';
import { useState, useEffect, useRef, useCallback } from 'react';
import isURL from 'validator/lib/isURL';

import NFTContextualActionsEventEmitter from '../components/nfts/NFTContextualActionsEventEmitter';
import computeHash from '../util/computeHash';
import getRemoteFileContent, { FileType } from '../util/getRemoteFileContent';
import { isImage, parseExtensionFromUrl } from '../util/utils';
import useNFTMetadata, { MAX_FILE_SIZE } from './useNFTMetadata';

const { ipcRenderer } = window as any;

type VerifyHash = {
  nft: NFTInfo;
  ignoreSizeLimit: boolean;
  isPreview: boolean;
  dataHash: string;
  nftId: string;
  setNFTCardMetadata?: (obj: any) => void;
  setNFTPreviewMetadataError: (error: string | undefined) => void;
};

let encoding: string = 'binary';

export default function useVerifyHash(props: VerifyHash): {
  isLoading: boolean;
  error: string | undefined;
  thumbnail: any;
  isValidationProcessed: boolean;
  encoding: string;
  isValid: boolean;
} {
  const { nft, ignoreSizeLimit, isPreview, dataHash, nftId, setNFTCardMetadata, setNFTPreviewMetadataError } = props;
  const [isValidationProcessed, setIsValidationProcessed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [thumbnail, setThumbnail] = useState({});

  const { metadata, isLoading: isLoadingMetadata, error: metadataError } = useNFTMetadata([nft]);

  const hashIsValid = useRef(false);

  const uri = nft.dataUris?.[0];

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
    localStorage.setItem(key, JSON.stringify(value));
  }

  const checkBinaryCache = useCallback(
    (obj: { thumbnailExists: boolean }) => {
      const { thumbnailExists } = obj;
      const contentCache = getCacheItem(`content-cache-${nftId}`);
      if (contentCache.binary) {
        if (!thumbnailExists) {
          setIsLoading(false);
          setThumbnail({
            binary: `cached://${contentCache.binary}`,
          });
        }
      }
      hashIsValid.current = contentCache.valid;
    },
    [nftId]
  );

  const validateHash = useCallback(
    async (forceValidateSHA256: boolean): Promise<void> => {
      let lastError: any;
      let uris: string[] = [];
      let videoThumbValid: boolean = false;
      let imageThumbValid: boolean = false;

      setError(undefined);
      setIsLoading(true);

      const thumbCache = getCacheItem(`thumb-cache-${nftId}`);
      const contentCache = getCacheItem(`content-cache-${nftId}`);

      if (contentCache) {
        hashIsValid.current = contentCache.valid;
      }

      if (!forceValidateSHA256 && isPreview) {
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
                /* eslint no-await-in-loop: off -- cannot be executed in parallel, because we need to
                 verify next hash only after previous was invalid */
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
        }
      }
      const thumbnailExists = videoThumbValid || imageThumbValid;
      /* ================== BINARY CONTENT ================== */
      if (isImage(uri) || forceValidateSHA256) {
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
            checkBinaryCache({ thumbnailExists });
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
              maxSize: ignoreSizeLimit || forceValidateSHA256 ? Infinity : MAX_FILE_SIZE,
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

      if (lastError) {
        setError(lastError);
      }
      setIsLoading(false);
      setIsValidationProcessed(true);
    },
    [
      checkBinaryCache,
      dataHash,
      ignoreSizeLimit,
      isPreview,
      metadata?.preview_image_hash,
      metadata?.preview_image_uris,
      metadata?.preview_video_hash,
      metadata?.preview_video_uris,
      nftId,
      uri,
    ]
  );

  useEffect(() => {
    if (!isLoadingMetadata) {
      validateHash(false);
      if (!isPreview && !isImage(uri)) {
        checkBinaryCache({ thumbnailExists: false });
      }
    }
  }, [uri, ignoreSizeLimit, isLoadingMetadata, isPreview, validateHash, checkBinaryCache]);

  useEffect(() => {
    function forceValidateBinary() {
      validateHash(true);
    }
    NFTContextualActionsEventEmitter.on(`force-reload-${nft.$nftId}`, forceValidateBinary);
    return () => {
      NFTContextualActionsEventEmitter.off(`force-reload-${nft.$nftId}`, forceValidateBinary);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- component mount
  }, []);

  useEffect(() => {
    if (metadata && setNFTCardMetadata) {
      setNFTCardMetadata(metadata);
    }
    setNFTPreviewMetadataError(metadataError);
  }, [isLoadingMetadata, metadata, metadataError, setNFTCardMetadata, setNFTPreviewMetadataError]);

  return {
    isLoading: isPreview ? isLoading : false,
    error,
    thumbnail,
    isValidationProcessed,
    encoding,
    isValid: hashIsValid.current,
  };
}

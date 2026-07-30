import type { NFTInfo } from '@chia-network/api';
import debug from 'debug';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

import type Metadata from '../@types/Metadata';
import compareChecksums from '../util/compareChecksums';

import selectNFTPreviewState, { type NFTPreviewState } from './selectNFTPreviewState';
import useCache from './useCache';
import useNFT from './useNFT';
import useNFTMetadata from './useNFTMetadata';

const log = debug('chia-gui:useNFTVerifyHash');

export type UseNFTVerifyHashOptions = {
  preview?: boolean;
  ignoreSizeLimit?: boolean;
};

export default function useNFTVerifyHash(nftId?: string, options: UseNFTVerifyHashOptions = {}) {
  const { preview = false, ignoreSizeLimit = false } = options;

  const { getChecksum } = useCache();

  const { nft, isLoading: isLoadingNFT, error: errorNFT } = useNFT(nftId);
  const { isLoading: isLoadingMetadata, metadata, error: errorMetadata } = useNFTMetadata(nftId);

  const [errorVerify, setErrorVerify] = useState<Error | undefined>();
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const [data, setData] = useState<NFTPreviewState | undefined>();
  const [previewVideo, setPreviewVideo] = useState<NFTPreviewState | undefined>();
  const [previewImage, setPreviewImage] = useState<NFTPreviewState | undefined>();
  const verificationGeneration = useRef(0);

  const isLoading = isLoadingNFT || isLoadingMetadata || isVerifying;
  const error = errorNFT || errorMetadata || errorVerify;

  const findValidUri = useCallback(
    async (
      uris: string[] | undefined,
      hash: string | undefined,
      onlyFirst: boolean = false,
    ): Promise<NFTPreviewState | undefined> => {
      if (!uris || !uris.length || !hash) {
        return undefined;
      }

      // use only first uri when onlyFirst is true
      const urisToCheck = onlyFirst ? [uris[0]] : uris;
      let first: NFTPreviewState | undefined;

      for (const uri of urisToCheck) {
        try {
          // eslint-disable-next-line no-await-in-loop -- we need sync version
          const checksum = await getChecksum(uri, {
            maxSize: ignoreSizeLimit ? -1 : undefined,
          });

          const isValid = compareChecksums(checksum, hash);
          if (isValid) {
            return {
              isVerified: true,
              uri,
            };
          }

          throw new Error('Invalid hash checksum');
        } catch (e) {
          log(`Failed to fetch ${uri}: ${(e as Error).message}`);
          const isMismatch = (e as Error).message === 'Invalid hash checksum';
          // a hash mismatch on any uri outranks a download failure — a
          // tampered file must not be reported as merely unavailable
          if (!first || (first.failedFetch && isMismatch)) {
            first = {
              isVerified: false,
              uri,
              error: e as Error,
              failedFetch: !isMismatch,
            };
          }
        }
      }

      return first;
    },
    [getChecksum, ignoreSizeLimit],
  );

  const verifyNFT = useCallback(
    async ({ dataHash, dataUris }: NFTInfo, nftMetadata: Metadata | undefined, generation: number) => {
      const updateIfCurrent = (update: () => void) => {
        if (verificationGeneration.current === generation) {
          update();
        }
      };

      async function validateData() {
        const dataState = await findValidUri(dataUris, dataHash);
        updateIfCurrent(() => setData(dataState));
      }

      async function validatePreview() {
        if (!preview || !nftMetadata) {
          return;
        }

        const { preview_video_uris: previewVideoUris, preview_video_hash: previewVideoHash } = nftMetadata;

        const videoState = await findValidUri(previewVideoUris, previewVideoHash);
        updateIfCurrent(() => setPreviewVideo(videoState));

        if (!videoState?.isVerified) {
          const { preview_image_uris: previewImageUris, preview_image_hash: previewImageHash } = nftMetadata;
          const imageState = await findValidUri(previewImageUris, previewImageHash);
          updateIfCurrent(() => setPreviewImage(imageState));
        }
      }

      try {
        // parallelize validation
        await Promise.all([validateData(), validatePreview()]);
      } catch (e) {
        updateIfCurrent(() => setErrorVerify(e as Error));
      } finally {
        updateIfCurrent(() => setIsVerifying(false));
      }
    },
    [preview, findValidUri],
  );

  useEffect(() => {
    const generation = verificationGeneration.current + 1;
    verificationGeneration.current = generation;

    setErrorVerify(undefined);
    setData(undefined);
    setPreviewVideo(undefined);
    setPreviewImage(undefined);

    if (!nft || isLoadingNFT || isLoadingMetadata) {
      setIsVerifying(false);
    } else {
      setIsVerifying(true);
      verifyNFT(nft, metadata, generation);
    }

    return () => {
      if (verificationGeneration.current === generation) {
        verificationGeneration.current += 1;
      }
    };
  }, [nft, metadata, isLoadingNFT, isLoadingMetadata, verifyNFT]);

  const previewState = useMemo(
    () =>
      selectNFTPreviewState({
        isVerifying,
        previewVideo,
        previewImage,
        data,
        previewVideoCandidate: preview
          ? {
              uris: metadata?.preview_video_uris,
              hash: metadata?.preview_video_hash,
            }
          : undefined,
        previewImageCandidate: preview
          ? {
              uris: metadata?.preview_image_uris,
              hash: metadata?.preview_image_hash,
            }
          : undefined,
        dataCandidate: {
          uris: nft?.dataUris,
          hash: nft?.dataHash,
        },
      }),
    [previewVideo, previewImage, data, nft, metadata, preview, isVerifying],
  );

  return {
    isVerified: data?.isVerified, // main data is the only one that matters
    isLoading,
    error,

    data,
    previewImage,
    previewVideo,

    // preview is the first valid preview found or data
    preview: previewState,
  };
}

import type { NFTInfo } from '@chia-network/api';
import { useEffect, useState, useCallback, useMemo } from 'react';

import type Metadata from '../@types/Metadata';
import compareChecksums from '../util/compareChecksums';
import useCache from './useCache';
import useNFTMetadata from './useNFTMetadata';

type PreviewState = {
  isVerified: boolean;
  error?: Error;
  uri?: string;
};

export type UseNFTVerifyHashProps = {
  nft: NFTInfo;
  preview?: boolean;
  ignoreSizeLimit?: boolean;
};

export default function useNFTVerifyHash(props: UseNFTVerifyHashProps) {
  const { nft, preview = false, ignoreSizeLimit = false } = props;
  const { getChecksum } = useCache();
  const { isLoading: isLoadingMetadata, metadata, error: errorMetadata } = useNFTMetadata(nft.$nftId);

  const [errorVerify, setErrorVerify] = useState<Error | undefined>();
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const [data, setData] = useState<PreviewState | undefined>();
  const [video, setVideo] = useState<PreviewState | undefined>();
  const [image, setImage] = useState<PreviewState | undefined>();

  const isLoading = isLoadingMetadata || isVerifying;
  const error = errorMetadata || errorVerify;

  const verify = useCallback(
    async (url: string, validChecksum: string) => {
      const checksum = await getChecksum(url, {
        maxSize: ignoreSizeLimit ? -1 : undefined,
      });

      return compareChecksums(checksum, validChecksum);
    },
    [getChecksum, ignoreSizeLimit]
  );

  const findValidUri = useCallback(
    async (
      uris: string[] | undefined,
      hash: string | undefined,
      onlyFirst: boolean = false
    ): Promise<PreviewState | undefined> => {
      if (!uris || !uris.length || !hash) {
        return undefined;
      }

      // use only first uri when onlyFirst is true
      const urisToCheck = onlyFirst ? [uris[0]] : uris;
      // eslint-disable-next-line no-restricted-syntax -- we are reading in sequence
      for (const uri of urisToCheck) {
        const isValid = await verify(uri, hash); // eslint-disable-line no-await-in-loop -- because we are using for loop and we want to check in sequence
        if (isValid) {
          return {
            isVerified: true,
            uri,
          };
        }
      }

      return {
        isVerified: false,
        error: new Error('Invalid hash checksum'),
      };
    },
    [verify]
  );

  const verifyNFT = useCallback(
    async ({ dataHash, dataUris }: NFTInfo, nftMetadata: Metadata) => {
      setIsVerifying(true);
      setErrorVerify(undefined);

      setData(undefined);
      setVideo(undefined);
      setImage(undefined);

      async function validateData() {
        const dataState = await findValidUri(dataUris, dataHash, true);
        setData(dataState);
      }

      async function validatePreview() {
        if (!preview) {
          return;
        }

        const { preview_video_uris: previewVideoUris, preview_video_hash: previewVideoHash } = nftMetadata;

        const videoState = await findValidUri(previewVideoUris, previewVideoHash);
        setVideo(videoState);

        if (!videoState?.isVerified) {
          const { preview_image_uris: previewImageUris, preview_image_hash: previewImageHash } = nftMetadata;
          const imageState = await findValidUri(previewImageUris, previewImageHash);
          setImage(imageState);
        }
      }

      try {
        // parallelize validation
        await Promise.all([validateData(), validatePreview()]);
      } catch (e) {
        setErrorVerify(e as Error);
      } finally {
        setIsVerifying(false);
      }
    },
    [preview, findValidUri]
  );

  useEffect(() => {
    if (nft && metadata) {
      verifyNFT(nft, metadata);
    }
  }, [nft, metadata, verifyNFT]);

  const previewState = useMemo(() => {
    if (video?.isVerified) {
      return video;
    }

    if (image?.isVerified) {
      return image;
    }

    if (data?.isVerified) {
      return data;
    }

    return video || image || data;
  }, [data, image, video]);

  return {
    isLoading,
    error,

    data,
    image,
    video,

    preview: previewState,
  };
}

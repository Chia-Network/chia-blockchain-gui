import type { NFTInfo } from '@chia-network/api';
import debug from 'debug';
import { useEffect, useState, useCallback, useMemo } from 'react';

import type Metadata from '../@types/Metadata';
import compareChecksums from '../util/compareChecksums';

import useCache from './useCache';
import useNFT from './useNFT';
import useNFTMetadata from './useNFTMetadata';

const log = debug('chia-gui:useNFTVerifyHash');

type PreviewState = {
  isVerified: boolean;
  uri: string;
  error?: Error;
  // the file could not be downloaded — distinct from a real hash mismatch
  failedFetch?: boolean;
  // optimistic state: checksums are still being computed for this uri
  isVerifying?: boolean;
};

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

  const [data, setData] = useState<PreviewState | undefined>();
  const [previewVideo, setPreviewVideo] = useState<PreviewState | undefined>();
  const [previewImage, setPreviewImage] = useState<PreviewState | undefined>();

  const isLoading = isLoadingNFT || isLoadingMetadata || isVerifying;
  const error = errorNFT || errorMetadata || errorVerify;

  const findValidUri = useCallback(
    async (
      uris: string[] | undefined,
      hash: string | undefined,
      onlyFirst: boolean = false,
    ): Promise<PreviewState | undefined> => {
      if (!uris || !uris.length || !hash) {
        return undefined;
      }

      // use only first uri when onlyFirst is true
      const urisToCheck = onlyFirst ? [uris[0]] : uris;
      let first: PreviewState | undefined;

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
    async ({ dataHash, dataUris }: NFTInfo, nftMetadata?: Metadata) => {
      setIsVerifying(true);
      setErrorVerify(undefined);

      setData(undefined);
      setPreviewVideo(undefined);
      setPreviewImage(undefined);

      async function validateData() {
        const dataState = await findValidUri(dataUris, dataHash);
        setData(dataState);
      }

      async function validatePreview() {
        if (!preview || !nftMetadata) {
          return;
        }

        const { preview_video_uris: previewVideoUris, preview_video_hash: previewVideoHash } = nftMetadata;

        const videoState = await findValidUri(previewVideoUris, previewVideoHash);
        setPreviewVideo(videoState);

        if (!videoState?.isVerified) {
          const { preview_image_uris: previewImageUris, preview_image_hash: previewImageHash } = nftMetadata;
          const imageState = await findValidUri(previewImageUris, previewImageHash);
          setPreviewImage(imageState);
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
    [preview, findValidUri],
  );

  useEffect(() => {
    if (nft) {
      verifyNFT(nft, metadata);
    }
  }, [nft, metadata, verifyNFT]);

  const previewState = useMemo(() => {
    if (previewVideo?.isVerified) {
      return previewVideo;
    }

    if (previewImage?.isVerified) {
      return previewImage;
    }

    if (data?.isVerified) {
      return data;
    }

    // Once verification has finished, report the settled result.
    if (!isVerifying) {
      const settled = previewVideo || previewImage || data;
      if (settled) {
        return settled;
      }
    }

    // While checksums are still being computed, expose the first candidate uri
    // whose validation has not already failed, so the thumbnail can render
    // immediately instead of waiting for the full data file to download and a
    // fast failure on one source does not flash an error tile while another
    // source is still pending. The verified state replaces this once known.
    const asCandidate = (uri: string | undefined): PreviewState | undefined =>
      uri
        ? {
            isVerified: false,
            isVerifying: true,
            uri,
          }
        : undefined;

    if (nft) {
      if (preview) {
        const videoUri = metadata?.preview_video_uris?.[0];
        if (videoUri && !previewVideo) {
          return asCandidate(videoUri);
        }

        const imageUri = metadata?.preview_image_uris?.[0];
        if (imageUri && !previewImage) {
          return asCandidate(imageUri);
        }
      }

      if (!data) {
        const candidate = asCandidate(nft.dataUris?.[0]);
        if (candidate) {
          return candidate;
        }
      }
    }

    // everything available has already failed — report the most relevant failure
    return previewVideo || previewImage || data;
  }, [previewVideo, previewImage, data, nft, metadata, preview, isVerifying]);

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

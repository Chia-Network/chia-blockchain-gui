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
  const [isVerifyingData, setIsVerifyingData] = useState<boolean>(false);
  const [isVerifyingPreview, setIsVerifyingPreview] = useState<boolean>(false);

  const [data, setData] = useState<NFTPreviewState | undefined>();
  const [previewVideo, setPreviewVideo] = useState<NFTPreviewState | undefined>();
  const [previewImage, setPreviewImage] = useState<NFTPreviewState | undefined>();
  const dataGeneration = useRef(0);
  const previewGeneration = useRef(0);

  // The inputs the preview effect last picked up. `isVerifyingPreview` is set
  // inside that effect, which runs only after the render has painted, so on
  // the frame where the metadata first arrives it still reads false — and an
  // already-verified data file would win the preview slot for that one frame
  // before the swap. Comparing the current inputs against this ref makes that
  // frame count as verifying synchronously.
  const previewInputs = useRef<{ nft?: NFTInfo; metadata?: Metadata }>({});

  const settledMetadata = isLoadingMetadata ? undefined : metadata;
  const isPreviewPassPending =
    preview &&
    !!nft &&
    !isLoadingNFT &&
    !!settledMetadata &&
    (previewInputs.current.nft !== nft || previewInputs.current.metadata !== settledMetadata);

  const isVerifying = isVerifyingData || isVerifyingPreview || isPreviewPassPending;

  // A pending metadata download only blocks the result while there is no
  // data verification outcome yet: `isVerified` is derived from the data
  // file alone, so once it settles a slow or dead metadata host must not
  // keep consumers (gallery tiles, hash status badges) in a loading state.
  const isLoading = isLoadingNFT || isVerifying || (isLoadingMetadata && !data);
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

  const validateData = useCallback(
    async ({ dataHash, dataUris }: NFTInfo, generation: number, generationRef: { current: number }) => {
      try {
        const dataState = await findValidUri(dataUris, dataHash);
        if (generationRef.current === generation) {
          setData(dataState);
        }
      } catch (e) {
        if (generationRef.current === generation) {
          setErrorVerify(e as Error);
        }
      } finally {
        if (generationRef.current === generation) {
          setIsVerifyingData(false);
        }
      }
    },
    [findValidUri],
  );

  const validatePreview = useCallback(
    async (nftMetadata: Metadata, generation: number, generationRef: { current: number }) => {
      try {
        const { preview_video_uris: previewVideoUris, preview_video_hash: previewVideoHash } = nftMetadata;

        const videoState = await findValidUri(previewVideoUris, previewVideoHash);
        if (generationRef.current === generation) {
          setPreviewVideo(videoState);
        }

        if (!videoState?.isVerified) {
          const { preview_image_uris: previewImageUris, preview_image_hash: previewImageHash } = nftMetadata;
          const imageState = await findValidUri(previewImageUris, previewImageHash);
          if (generationRef.current === generation) {
            setPreviewImage(imageState);
          }
        }
      } catch (e) {
        if (generationRef.current === generation) {
          setErrorVerify(e as Error);
        }
      } finally {
        if (generationRef.current === generation) {
          setIsVerifyingPreview(false);
        }
      }
    },
    [findValidUri],
  );

  // Data and preview verification run as independent effects: the data file
  // depends only on the NFT record, so a metadata fetch that settles later
  // must re-run only the preview half. A single combined effect used to reset
  // an already-verified data state whenever the metadata arrived, which threw
  // tiles that were already showing the data file back into a loading state.
  useEffect(() => {
    const generation = dataGeneration.current + 1;
    dataGeneration.current = generation;

    setErrorVerify(undefined);
    setData(undefined);

    if (!nft || isLoadingNFT) {
      setIsVerifyingData(false);
    } else {
      setIsVerifyingData(true);
      validateData(nft, generation, dataGeneration);
    }

    return () => {
      if (dataGeneration.current === generation) {
        dataGeneration.current += 1;
      }
    };
  }, [nft, isLoadingNFT, validateData]);

  useEffect(() => {
    const generation = previewGeneration.current + 1;
    previewGeneration.current = generation;

    setPreviewVideo(undefined);
    setPreviewImage(undefined);

    // Metadata downloads can be slow or fail entirely — the data effect above
    // verifies the data file right away, and this effect picks up the preview
    // URIs once the metadata fetch settles, instead of blocking on it.
    const nftMetadata = isLoadingMetadata ? undefined : metadata;
    previewInputs.current = { nft: !isLoadingNFT ? nft : undefined, metadata: nftMetadata };
    if (!preview || !nft || isLoadingNFT || !nftMetadata) {
      setIsVerifyingPreview(false);
    } else {
      setIsVerifyingPreview(true);
      validatePreview(nftMetadata, generation, previewGeneration);
    }

    return () => {
      if (previewGeneration.current === generation) {
        previewGeneration.current += 1;
      }
    };
  }, [preview, nft, metadata, isLoadingNFT, isLoadingMetadata, validatePreview]);

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

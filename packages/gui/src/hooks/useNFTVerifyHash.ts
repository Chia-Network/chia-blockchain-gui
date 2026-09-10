import type { NFTInfo } from '@chia-network/api';
import debug from 'debug';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

import type Metadata from '../@types/Metadata';
import compareChecksums from '../util/compareChecksums';
import { MAX_URIS_PER_CANDIDATE } from '../util/getNFTPreviewStatusFromCache';

import selectNFTPreviewState, { type NFTPreviewState } from './selectNFTPreviewState';
import useCache from './useCache';
import useIpfsGateway from './useIpfsGateway';
import { useIpfsGatewayBase } from './useIpfsGatewayUrl';
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
  // Not read directly: these change which URLs the main process will fetch
  // (whether ipfs URIs are fetched at all, and through which gateway), so
  // both verification effects list them as dependencies and re-run when the
  // user flips the option or picks another gateway — without this, NFTs
  // already on screen would keep their failed state until a remount.
  const [ipfsGateway] = useIpfsGateway();
  const ipfsGatewayBase = useIpfsGatewayBase();

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

  // The inputs each verification effect last picked up. The effects run only
  // after the render has painted, which leaves two gaps these refs close
  // synchronously:
  // - a "pass pending" flag: on the frame where an input first arrives the
  //   effect-set isVerifying flags still read false, and an already-verified
  //   lower-priority source would win the preview slot for that one frame;
  // - staleness: on the frame where nftId switches, the stored states still
  //   hold the previous NFT's results, and surfacing them would flash the
  //   previous NFT's media (and hash verdict) until the effects reset them.
  const dataInputs = useRef<{ nft?: NFTInfo }>({});
  const previewInputs = useRef<{ nft?: NFTInfo; metadata?: Metadata }>({});

  const settledNft = !isLoadingNFT ? nft : undefined;
  const settledMetadata = isLoadingMetadata ? undefined : metadata;

  const isDataStale = dataInputs.current.nft !== settledNft;
  const isPreviewStale = previewInputs.current.nft !== settledNft;

  const currentData = isDataStale ? undefined : data;
  const currentPreviewVideo = isPreviewStale ? undefined : previewVideo;
  const currentPreviewImage = isPreviewStale ? undefined : previewImage;

  const isDataPassPending = !!settledNft && isDataStale;
  const isPreviewPassPending =
    preview &&
    !!settledNft &&
    !!settledMetadata &&
    (previewInputs.current.nft !== settledNft || previewInputs.current.metadata !== settledMetadata);

  const isVerifying = isVerifyingData || isVerifyingPreview || isDataPassPending || isPreviewPassPending;

  // A pending metadata download only blocks the result while there is no
  // data verification outcome yet: `isVerified` is derived from the data
  // file alone, so once it settles a slow or dead metadata host must not
  // keep consumers (gallery tiles, hash status badges) in a loading state.
  const isLoading = isLoadingNFT || isVerifying || (isLoadingMetadata && !currentData);
  // errorVerify is cleared by the data effect, so it is stale on the same
  // frames the stored states are
  const error = errorNFT || errorMetadata || (isDataStale ? undefined : errorVerify);

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
      // The lists are minter-authored and unbounded; the gallery sweep and a
      // refresh stop at MAX_URIS_PER_CANDIDATE, and so does verification.
      const urisToCheck = onlyFirst ? [uris[0]] : uris.slice(0, MAX_URIS_PER_CANDIDATE);
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

    dataInputs.current = { nft: !isLoadingNFT ? nft : undefined };
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
  }, [nft, isLoadingNFT, validateData, ipfsGateway, ipfsGatewayBase]);

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
  }, [preview, nft, metadata, isLoadingNFT, isLoadingMetadata, validatePreview, ipfsGateway, ipfsGatewayBase]);

  const previewState = useMemo(
    () =>
      selectNFTPreviewState({
        isVerifying,
        previewVideo: currentPreviewVideo,
        previewImage: currentPreviewImage,
        data: currentData,
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
    [currentPreviewVideo, currentPreviewImage, currentData, nft, metadata, preview, isVerifying],
  );

  return {
    isVerified: currentData?.isVerified, // main data is the only one that matters
    isLoading,
    error,

    data: currentData,
    previewImage: currentPreviewImage,
    previewVideo: currentPreviewVideo,

    // preview is the first valid preview found or data
    preview: previewState,
  };
}

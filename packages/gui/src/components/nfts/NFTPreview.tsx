import {
  IconMessage,
  Loading,
  Flex,
  SandboxedIframe,
  getSemanticColors,
  usePersistState,
  useDarkMode,
  useThemeAssets,
} from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { Loop as LoopIcon, NotInterested } from '@mui/icons-material';
import { alpha, Box, IconButton, Tooltip } from '@mui/material';
import React, { useMemo, useRef, Fragment, useCallback, useEffect, type ReactNode } from 'react';
import styled from 'styled-components';

import NFTPreviewStatus from '../../@types/NFTPreviewStatus';
import DocumentBlobIcon from '../../assets/img/document-blob.svg';
import DocumentPngIcon from '../../assets/img/document.png';
import DocumentPngDarkIcon from '../../assets/img/document_dark.png';
import ModelBlobIcon from '../../assets/img/model-blob.svg';
import ModelPngIcon from '../../assets/img/model.png';
import ModelPngDarkIcon from '../../assets/img/model_dark.png';
import UnknownBlobIcon from '../../assets/img/unknown-blob.svg';
import UnknownPngIcon from '../../assets/img/unknown.png';
import UnknownPngDarkIcon from '../../assets/img/unknown_dark.png';
import VideoBlobIcon from '../../assets/img/video-blob.svg';
import VideoPngIcon from '../../assets/img/video.png';
import VideoPngDarkIcon from '../../assets/img/video_dark.png';
import FileType from '../../constants/FileType';
import { isSettledHashMismatch } from '../../hooks/selectNFTPreviewState';
import useCache from '../../hooks/useCache';
import useFileType from '../../hooks/useFileType';
import useHideObjectionableContent from '../../hooks/useHideObjectionableContent';
import useNFT from '../../hooks/useNFT';
import useNFTImageFittingMode from '../../hooks/useNFTImageFittingMode';
import useNFTMetadata from '../../hooks/useNFTMetadata';
import useNFTProvider from '../../hooks/useNFTProvider';
import useNFTVerifyHash from '../../hooks/useNFTVerifyHash';
import { useNFTVideoLoopGlobal, useNFTVideoLoopForNFT } from '../../hooks/useNFTVideoLoop';
import useStateAbort from '../../hooks/useStateAbort';
import getFileExtension from '../../util/getFileExtension';
import getNFTId from '../../util/getNFTId';
import hasSensitiveContent from '../../util/hasSensitiveContent';
import probeMediaPlayability from '../../util/probeMediaPlayability';

import NFTHashStatus from './NFTHashStatus';

const StyledCardPreview = styled(Box)`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background-color: ${({ theme }) => theme.palette.background.paper};
`;

const IframePreventEvents = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  z-index: 2;
`;

const ModelExtension = styled.div`
  position: relative;
  top: -20px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 16px;
  background: ${({ theme }) => theme.palette.background.paper};
  box-shadow:
    0px 0px 24px ${({ theme }) => alpha(theme.palette.primary.main, 0.5)},
    0px 4px 8px ${({ theme }) => alpha(theme.palette.text.primary, 0.22)};
  border-radius: 32px;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const BlobBg = styled.div`
  > svg {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    linearGradient {
      >stop: first-child {
        stop-color: ${({ theme }) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.32 : 0.18)};
      }
      >stop: last-child {
        stop-color: ${({ theme }) => theme.palette.primary.main};
      }
    }
  }
  > img {
    position: relative;
  }
`;

const CompactExtension = styled.div`
  position: absolute;
  top: 48px;
  left: 0;
  right: 4px;
  text-align: center;
  color: ${({ theme }) => theme.palette.primary.main};
`;

export type NFTPreviewProps = {
  id: string;
  width?: number | string;
  height?: number | string;
  ratio?: number;
  fit?: 'cover' | 'contain' | 'fill';
  background?: any;
  preview?: boolean;
  icon?: boolean;
  isCompact?: boolean;
  disableInteractions?: boolean;
  hideStatus?: boolean;
};

export default function NFTPreview(props: NFTPreviewProps) {
  const [nftImageFittingMode] = useNFTImageFittingMode();
  const {
    id,
    width = '100%',
    height = 'auto',
    ratio = 1,
    fit = nftImageFittingMode,
    background: Background = Fragment,
    preview: isPreview = false,
    isCompact = false,
    disableInteractions = false,
    icon = false,
    hideStatus = false,
  } = props;

  const { getURI } = useCache();
  const { setPreviewStatus } = useNFTProvider();
  const nftId = useMemo(() => getNFTId(id), [id]);
  const iframeRef = useRef<any>(null);
  const { isDarkMode } = useDarkMode();
  const { audioSmall, documentSmall, modelSmall, unknownSmall, videoSmall } = useThemeAssets();
  const [prepareError, setPrepareError] = useStateAbort<Error | undefined>(undefined);
  const [previewContent, setPreviewContent] = useStateAbort<ReactNode | undefined>(undefined);
  const abortControllerRef = useRef(new AbortController());
  const [hideObjectionableContent] = useHideObjectionableContent();
  const [ignoreSizeLimit /* , setIgnoreSizeLimit */] = usePersistState<boolean>(
    false,
    `nft-preview-ignore-size-limit-${nftId}`,
  );

  // Verified media files Chromium turned out not to decode (an HEVC video on
  // Linux, say), recorded by preparePreview after probing the cached file —
  // the sandboxed player cannot report the failure itself. Handed back to the
  // verifier so it passes over an unplayable preview video and settles on the
  // next source (preview image, data file) instead; the data file itself is
  // never skipped, so an unplayable data file ends up as the notice below.
  const [unplayableUris, setUnplayableUris] = useStateAbort<string[]>([]);

  const { preview, isLoading: isLoadingVerifyHash } = useNFTVerifyHash(nftId, {
    preview: isPreview,
    ignoreSizeLimit,
    excludedPreviewUris: unplayableUris,
  });

  const { type: previewFileType, isLoading: isLoadingFileType } = useFileType(preview?.uri);
  const [globalVideoLoop] = useNFTVideoLoopGlobal();
  const [perVideoLoop, setPerVideoLoop] = useNFTVideoLoopForNFT(nftId);
  const loopVideo = globalVideoLoop || perVideoLoop;

  const handleToggleVideoLoop = useCallback(
    (event: React.MouseEvent) => {
      // the button sits inside clickable areas (grid card navigation, detail
      // view fullscreen) — keep the click from reaching them
      event.stopPropagation();
      setPerVideoLoop(!perVideoLoop);
    },
    [perVideoLoop, setPerVideoLoop],
  );

  const { isLoading: isLoadingNFT } = useNFT(nftId);
  const { metadata, isLoading: isLoadingMetadata } = useNFTMetadata(nftId);
  // hash verification downloads the full data file, which can take a long
  // time for large media, and the metadata host can be slow or dead — either
  // one only blocks the tile while there is no verified preview uri to show
  const isLoading = isLoadingNFT || isLoadingFileType || ((isLoadingVerifyHash || isLoadingMetadata) && !preview);

  const blurPreview = useMemo(() => {
    if (!hideObjectionableContent) {
      return false;
    }

    // a verified preview can render before the metadata fetch settles — keep
    // it covered until the sensitive-content flag can actually be read
    if (isLoadingMetadata) {
      return true;
    }

    if (!metadata) {
      return false;
    }

    if (hasSensitiveContent(metadata)) {
      return true;
    }

    return false;
  }, [hideObjectionableContent, isLoadingMetadata, metadata]);

  const previewExtension = useMemo(() => getFileExtension(preview?.uri), [preview]);

  // The cached bytes of a settled mismatch must never reach the iframe, even
  // though the state still carries the uri so the hash badge can report it.
  const isHashMismatch = isSettledHashMismatch(preview);

  const previewUri = isHashMismatch ? undefined : preview?.uri;
  const isUnplayable = !!previewUri && unplayableUris.includes(previewUri);

  const preparePreview = useCallback(
    async (signal: AbortSignal) => {
      try {
        setPrepareError(undefined, signal);

        if (!previewUri) {
          setPreviewContent(undefined, signal);
          return;
        }

        const style = `
          html, body {
            border: 0px;
            margin: 0px;
            padding: 0px;
            height: 100%;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          img {
            object-fit: ${fit};
          }

          /* Belt and braces with controlsList/disablePictureInPicture below:
             the overflow menu is the one control that opens a popup upward,
             where the grid navigation blockers would swallow its clicks. */
          video::-webkit-media-controls-overflow-button,
          audio::-webkit-media-controls-overflow-button {
            display: none;
          }
        `;

        const cachedURI = await getURI(previewUri, { maxSize: ignoreSizeLimit ? -1 : undefined });
        if (!cachedURI || !cachedURI.startsWith('cache://')) {
          setPreviewContent(undefined, signal);
          setPrepareError(new Error(t`File is not available`), signal);
          return;
        }

        // The player runs in a scriptless sandbox and cannot say when Chromium
        // rejects the stream, so ask the media pipeline first. Only a definite
        // verdict counts — a probe that fails for any other reason falls
        // through to the player as before.
        if (previewFileType === FileType.VIDEO || previewFileType === FileType.AUDIO) {
          const playability = await probeMediaPlayability(
            cachedURI,
            previewFileType === FileType.VIDEO ? 'video' : 'audio',
            { signal },
          );
          if (signal.aborted) {
            return;
          }
          if (playability === 'unsupported') {
            setPreviewContent(undefined, signal);
            setUnplayableUris((uris) => (uris.includes(previewUri) ? uris : [...uris, previewUri]), signal);
            return;
          }
        }

        // Interactivity is controlled outside the iframe (pointer-events on
        // the iframe plus the IframePreventEvents overlay), never inside the
        // srcDoc: the sandbox forbids scripts, so any srcDoc change forces a
        // full remount, and gating `controls` on disableInteractions would
        // remount every gallery tile whenever multi-select is toggled.
        setPreviewContent(
          <>
            <style>{style}</style>
            {/* controlsList/disablePictureInPicture empty Chromium's overflow
                menu (download and remote playback are blocked by the sandbox
                anyway), so no control opens a popup that would extend upward
                under the grid navigation blockers */}
            {previewFileType === FileType.VIDEO ? (
              <video
                width="100%"
                height="100%"
                controls
                controlsList="nodownload noplaybackrate noremoteplayback"
                disablePictureInPicture
                loop={loopVideo}
              >
                <source src={cachedURI} />
              </video>
            ) : previewFileType === FileType.AUDIO ? (
              <audio
                className={isDarkMode ? 'dark' : ''}
                controls
                controlsList="nodownload noplaybackrate noremoteplayback"
              >
                <source src={cachedURI} />
              </audio>
            ) : (
              <img src={cachedURI} alt={t`Preview`} width="100%" height="100%" />
            )}
          </>,
          signal,
        );
      } catch (e) {
        setPreviewContent(undefined, signal);
        setPrepareError(e as Error, signal);
      }
    },
    [
      previewUri,
      fit,
      getURI,
      ignoreSizeLimit,
      previewFileType,
      loopVideo,
      isDarkMode,
      setPreviewContent,
      setPrepareError,
      setUnplayableUris,
    ],
  );

  useEffect(() => {
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    preparePreview(abortControllerRef.current.signal);
  }, [preparePreview]);

  const previewCompactIcon = useMemo(() => {
    switch (previewFileType) {
      case FileType.VIDEO:
        return React.createElement(videoSmall, { width: '100%' });
      case FileType.AUDIO:
        return React.createElement(audioSmall, { width: '100%' });
      case FileType.MODEL:
        return React.createElement(modelSmall, { width: '100%' });
      case FileType.DOCUMENT:
        return React.createElement(documentSmall, { width: '100%' });
      default: {
        if (previewExtension) {
          return <CompactExtension>.{previewExtension}</CompactExtension>;
        }

        return React.createElement(unknownSmall, { width: '100%' });
      }
    }
  }, [previewFileType, previewExtension, audioSmall, documentSmall, modelSmall, unknownSmall, videoSmall]);

  const previewIcon = useMemo(() => {
    switch (previewFileType) {
      case FileType.DOCUMENT:
        return (
          <BlobBg>
            <DocumentBlobIcon />
            <img src={isDarkMode ? DocumentPngDarkIcon : DocumentPngIcon} />
          </BlobBg>
        );
      /*
      case FileType.AUDIO:
        return (
          <BlobBg isDarkMode={isDarkMode}>
            <AudioBlobIcon />
            <img src={isDarkMode ? AudioPngDarkIcon : AudioPngIcon} />
          </BlobBg>
        );
        */
      case FileType.VIDEO:
        return (
          <BlobBg>
            <VideoBlobIcon />
            <img src={isDarkMode ? VideoPngDarkIcon : VideoPngIcon} />
          </BlobBg>
        );
      case FileType.MODEL:
        return (
          <BlobBg>
            <ModelBlobIcon />
            <img src={isDarkMode ? ModelPngDarkIcon : ModelPngIcon} />
          </BlobBg>
        );
      default:
        return (
          <BlobBg>
            <UnknownBlobIcon />
            <img src={isDarkMode ? UnknownPngDarkIcon : UnknownPngIcon} />
          </BlobBg>
        );
    }
  }, [previewFileType, isDarkMode]);

  const previewIframe = useMemo(() => {
    if (isCompact && previewFileType !== FileType.IMAGE) {
      return (
        <Flex alignItems="center" justifyContent="center">
          <Flex width="50%" alignItems="center" justifyContent="center">
            {previewCompactIcon}
          </Flex>
        </Flex>
      );
    }

    if (icon || [FileType.MODEL, FileType.DOCUMENT].includes(previewFileType)) {
      return (
        <>
          {previewIcon}
          {previewExtension && <ModelExtension>.{previewExtension}</ModelExtension>}
        </>
      );
    }

    const isPlayable = previewFileType === FileType.VIDEO || previewFileType === FileType.AUDIO;
    const canInteract = !disableInteractions && isPlayable;
    // In the gallery grid the media controls are directly clickable, while the
    // rest of the tile keeps navigating to the detail view. The blockers below
    // sit over the non-control area only, so clicks there fall through to the
    // card while the native controls (play, seek, volume) stay exposed.
    const showGridNavigationBlockers = isPreview && canInteract;

    return (
      <Box
        ref={iframeRef}
        sx={{
          padding: 0,
          margin: 0,
          height: '100%',
          width: '100%',
          position: 'relative',
        }}
      >
        {!canInteract && <IframePreventEvents />}
        <SandboxedIframe hideUntilLoaded allowPointerEvents={canInteract}>
          {previewContent}
        </SandboxedIframe>
        {showGridNavigationBlockers &&
          (previewFileType === FileType.VIDEO ? (
            // video controls render along the bottom edge of the tile
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 48, zIndex: 2 }} />
          ) : (
            // the audio control bar renders centered vertically in the tile
            <>
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 'calc(50% - 32px)', zIndex: 2 }} />
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 'calc(50% - 32px)', zIndex: 2 }} />
            </>
          ))}
        {previewFileType === FileType.VIDEO && canInteract && !blurPreview && (
          <Tooltip
            title={
              globalVideoLoop ? (
                <Trans>Looping is enabled for all videos in Settings</Trans>
              ) : loopVideo ? (
                <Trans>Looping on</Trans>
              ) : (
                <Trans>Loop video</Trans>
              )
            }
            placement="left"
          >
            {/* wrapper keeps the tooltip working while the button is disabled,
                and swallows the click itself: a disabled button receives no
                pointer events, so without this the click would bubble into the
                card action area and navigate to the NFT */}
            <Box
              sx={{ position: 'absolute', top: 8, right: 8, zIndex: 3 }}
              onClick={(event: React.MouseEvent) => event.stopPropagation()}
            >
              <IconButton
                size="small"
                disabled={globalVideoLoop}
                onClick={handleToggleVideoLoop}
                sx={(theme) => {
                  // highlight stays readable on this overlay; Chia light primary.main does not
                  const loopAccent = getSemanticColors(theme.palette).highlight;
                  return {
                    backgroundColor: alpha(theme.palette.common.black, 0.4),
                    color: loopVideo ? loopAccent : theme.palette.common.white,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.common.black, 0.6),
                    },
                    '&.Mui-disabled': {
                      backgroundColor: alpha(theme.palette.common.black, 0.4),
                      color: loopAccent,
                    },
                  };
                }}
              >
                <LoopIcon fontSize="small" />
              </IconButton>
            </Box>
          </Tooltip>
        )}
        {blurPreview && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'background.paper',
            }}
          >
            <UnknownBlobIcon width="100%" height="100%" />
          </Box>
        )}
      </Box>
    );
  }, [
    isPreview,
    isCompact,
    previewFileType,
    disableInteractions,
    previewIcon,
    icon,
    previewExtension,
    previewContent,
    iframeRef,
    blurPreview,
    previewCompactIcon,
    globalVideoLoop,
    loopVideo,
    handleToggleVideoLoop,
  ]);

  const hasFile = !!preview;

  // icon, model, document and compact non-image previews do not render the
  // iframe, so they never wait for the preview file to download
  const usesIframe =
    !(isCompact && previewFileType !== FileType.IMAGE) &&
    !icon &&
    ![FileType.MODEL, FileType.DOCUMENT].includes(previewFileType);

  // The verdict behind the gallery's preview filter. It follows the
  // verification state rather than the render path: a document or model
  // tile draws its type icon even when the file could not be fetched, and a
  // compact tile never opens the iframe, yet the file is just as unavailable
  // (the hash badge says so) — so every preview-mode tile of an NFT reaches
  // the same verdict, whichever of them happens to mount. Undefined while
  // anything that could still change the verdict is in flight.
  const previewStatus = useMemo(() => {
    if (isLoading || isLoadingVerifyHash) {
      return undefined;
    }

    if (!preview?.isVerified) {
      // no file, a settled mismatch, or a file that failed to download — but
      // a thumbnail in metadata that has not arrived yet may still verify
      return isLoadingMetadata ? undefined : NFTPreviewStatus.UNAVAILABLE;
    }

    if (prepareError || isUnplayable) {
      // the verified file could not be served from the cache, or Chromium
      // cannot decode it — either way there is nothing to show
      return NFTPreviewStatus.UNAVAILABLE;
    }

    if (!previewContent) {
      // preparePreview has not settled on this uri yet
      return undefined;
    }

    return NFTPreviewStatus.AVAILABLE;
  }, [isLoading, isLoadingVerifyHash, isLoadingMetadata, preview, prepareError, previewContent, isUnplayable]);

  useEffect(() => {
    // Only preview-mode tiles report: the detail view verifies the full data
    // file rather than the thumbnail and can legitimately disagree with the
    // gallery tile for the same NFT.
    if (isPreview && previewStatus) {
      setPreviewStatus(nftId, previewStatus);
    }
  }, [isPreview, previewStatus, nftId, setPreviewStatus]);

  return (
    <StyledCardPreview width={width} height={height} sx={{ aspectRatio: ratio.toString() }}>
      {isLoading ? (
        <Flex position="absolute" left="0" top="0" bottom="0" right="0" justifyContent="center" alignItems="center">
          <Loading center>{!isCompact && (isPreview ? t`Loading preview...` : t`Loading NFT...`)}</Loading>
        </Flex>
      ) : !hasFile ? (
        <Background>
          <IconMessage icon={<NotInterested fontSize="large" />}>
            <Trans>No file available</Trans>
          </IconMessage>
        </Background>
      ) : isHashMismatch ? (
        <Background>
          <IconMessage icon={<NotInterested fontSize="large" />}>
            <Trans>File does not match the expected hash</Trans>
          </IconMessage>
        </Background>
      ) : usesIframe && isUnplayable ? (
        <Background>
          <IconMessage icon={<NotInterested fontSize="large" />}>
            {previewFileType === FileType.AUDIO ? (
              <Trans>This audio format cannot be played here</Trans>
            ) : (
              <Trans>This video format cannot be played here</Trans>
            )}
          </IconMessage>
        </Background>
      ) : usesIframe && prepareError ? (
        <Background>
          <IconMessage icon={<NotInterested fontSize="large" />}>
            <Trans>Preview is not available</Trans>
          </IconMessage>
        </Background>
      ) : usesIframe && !previewContent ? (
        <Flex position="absolute" left="0" top="0" bottom="0" right="0" justifyContent="center" alignItems="center">
          <Loading center>{!isCompact && t`Loading preview...`}</Loading>
        </Flex>
      ) : (
        previewIframe
      )}

      {!isCompact && !hideStatus && (
        <Box
          sx={{
            display: 'flex',
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <NFTHashStatus nftId={nftId} hideValid />
        </Box>
      )}
    </StyledCardPreview>
  );
}

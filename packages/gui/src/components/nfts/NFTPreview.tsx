import { Color, IconMessage, Loading, Flex, SandboxedIframe, usePersistState, useDarkMode } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { NotInterested } from '@mui/icons-material';
import { alpha, Box } from '@mui/material';
import React, { useMemo, useRef, Fragment, useCallback, useEffect, type ReactNode } from 'react';
import styled from 'styled-components';

import AudioSmallIcon from '../../assets/img/audio-small.svg';
import DocumentBlobIcon from '../../assets/img/document-blob.svg';
import DocumentSmallIcon from '../../assets/img/document-small.svg';
import DocumentPngIcon from '../../assets/img/document.png';
import DocumentPngDarkIcon from '../../assets/img/document_dark.png';
import ModelBlobIcon from '../../assets/img/model-blob.svg';
import ModelSmallIcon from '../../assets/img/model-small.svg';
import ModelPngIcon from '../../assets/img/model.png';
import ModelPngDarkIcon from '../../assets/img/model_dark.png';
import UnknownBlobIcon from '../../assets/img/unknown-blob.svg';
import UnknownSmallIcon from '../../assets/img/unknown-small.svg';
import UnknownPngIcon from '../../assets/img/unknown.png';
import UnknownPngDarkIcon from '../../assets/img/unknown_dark.png';
import VideoBlobIcon from '../../assets/img/video-blob.svg';
import VideoSmallIcon from '../../assets/img/video-small.svg';
import VideoPngIcon from '../../assets/img/video.png';
import VideoPngDarkIcon from '../../assets/img/video_dark.png';
import FileType from '../../constants/FileType';
import useCache from '../../hooks/useCache';
import useFileType from '../../hooks/useFileType';
import useHideObjectionableContent from '../../hooks/useHideObjectionableContent';
import useNFT from '../../hooks/useNFT';
import useNFTImageFittingMode from '../../hooks/useNFTImageFittingMode';
import useNFTMetadata from '../../hooks/useNFTMetadata';
import useNFTVerifyHash from '../../hooks/useNFTVerifyHash';
import useStateAbort from '../../hooks/useStateAbort';
import getFileExtension from '../../util/getFileExtension';
import getNFTId from '../../util/getNFTId';
import hasSensitiveContent from '../../util/hasSensitiveContent';

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

const ModelExtension = styled.div<{ isDarkMode: boolean }>`
  position: relative;
  top: -20px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 16px;
  background: ${(props) => (props.isDarkMode ? Color.Neutral[800] : Color.Neutral[50])};
  box-shadow:
    0px 0px 24px ${alpha(Color.Green[500], 0.5)},
    0px 4px 8px ${alpha(Color.Green[700], 0.32)};
  border-radius: 32px;
  color: ${(props) => (props.isDarkMode ? Color.Neutral[50] : Color.Neutral[800])};
`;

const BlobBg = styled.div<{ isDarkMode: boolean }>`
  > svg {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    linearGradient {
      >stop: first-child {
        stop-color: ${(props) => (props.isDarkMode ? Color.Green[800] : Color.Lime[100])};
      }
      >stop: last-child {
        stop-color: ${(props) => (props.isDarkMode ? Color.Green[300] : Color.Green[400])};
      }
    }
  }
  > img {
    position: relative;
  }
`;

const CompactVideoIcon = styled(VideoSmallIcon)``;
const CompactAudioIcon = styled(AudioSmallIcon)``;
const CompactUnknownIcon = styled(UnknownSmallIcon)``;
const CompactDocumentIcon = styled(DocumentSmallIcon)``;
const CompactModelIcon = styled(ModelSmallIcon)``;

const CompactExtension = styled.div`
  position: absolute;
  top: 48px;
  left: 0;
  right: 4px;
  text-align: center;
  color: ${Color.Green[500]};
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
  const nftId = useMemo(() => getNFTId(id), [id]);
  const iframeRef = useRef<any>(null);
  const { isDarkMode } = useDarkMode();
  const [, setError] = useStateAbort<Error | undefined>(undefined);
  const [previewContent, setPreviewContent] = useStateAbort<ReactNode | undefined>(undefined);
  const abortControllerRef = useRef(new AbortController());
  const [hideObjectionableContent] = useHideObjectionableContent();
  const [ignoreSizeLimit /* , setIgnoreSizeLimit */] = usePersistState<boolean>(
    false,
    `nft-preview-ignore-size-limit-${nftId}`,
  );

  const { preview, isLoading: isLoadingVerifyHash } = useNFTVerifyHash(nftId, {
    preview: isPreview,
    ignoreSizeLimit,
  });

  const { type: previewFileType, isLoading: isLoadingFileType } = useFileType(preview?.uri);

  const { isLoading: isLoadingNFT } = useNFT(nftId);
  const { metadata, isLoading: isLoadingMetadata } = useNFTMetadata(nftId);
  const isLoading = isLoadingVerifyHash || isLoadingMetadata || isLoadingNFT || isLoadingFileType;

  const blurPreview = useMemo(() => {
    if (!hideObjectionableContent) {
      return false;
    }

    if (isLoading) {
      return false;
    }

    if (!metadata) {
      return false;
    }

    if (hasSensitiveContent(metadata)) {
      return true;
    }

    return false;
  }, [hideObjectionableContent, isLoading, metadata]);

  const previewExtension = useMemo(() => getFileExtension(preview?.uri), [preview]);

  const preparePreview = useCallback(
    async (signal: AbortSignal) => {
      try {
        setError(undefined, signal);

        if (!preview?.uri) {
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
        `;

        const cachedURI = await getURI(preview.uri);
        if (!cachedURI || !cachedURI.startsWith('cache://')) {
          setPreviewContent(undefined, signal);
          return;
        }

        setPreviewContent(
          <>
            <style>{style}</style>
            {previewFileType === FileType.VIDEO ? (
              <video width="100%" height="100%" controls={!disableInteractions}>
                <source src={cachedURI} />
              </video>
            ) : previewFileType === FileType.AUDIO ? (
              <audio className={isDarkMode ? 'dark' : ''} controls={!disableInteractions}>
                <source src={cachedURI} />
              </audio>
            ) : (
              <img src={cachedURI} alt={t`Preview`} width="100%" height="100%" />
            )}
          </>,
          signal,
        );
      } catch (e) {
        setError(e as Error, signal);
      }
    },
    [preview, fit, getURI, previewFileType, disableInteractions, isDarkMode, setPreviewContent, setError],
  );

  useEffect(() => {
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    preparePreview(abortControllerRef.current.signal);
  }, [preparePreview]);

  const previewCompactIcon = useMemo(() => {
    switch (previewFileType) {
      case FileType.VIDEO:
        return <CompactVideoIcon width="100%" />;
      case FileType.AUDIO:
        return <CompactAudioIcon width="100%" />;
      case FileType.MODEL:
        return <CompactModelIcon width="100%" />;
      case FileType.DOCUMENT:
        return <CompactDocumentIcon width="100%" />;
      default: {
        if (previewExtension) {
          return <CompactExtension>.{previewExtension}</CompactExtension>;
        }

        return <CompactUnknownIcon width="100%" />;
      }
    }
  }, [previewFileType, previewExtension]);

  const previewIcon = useMemo(() => {
    switch (previewFileType) {
      case FileType.DOCUMENT:
        return (
          <BlobBg isDarkMode={isDarkMode}>
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
          <BlobBg isDarkMode={isDarkMode}>
            <VideoBlobIcon />
            <img src={isDarkMode ? VideoPngDarkIcon : VideoPngIcon} />
          </BlobBg>
        );
      case FileType.MODEL:
        return (
          <BlobBg isDarkMode={isDarkMode}>
            <ModelBlobIcon />
            <img src={isDarkMode ? ModelPngDarkIcon : ModelPngIcon} />
          </BlobBg>
        );
      default:
        return (
          <BlobBg isDarkMode={isDarkMode}>
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
          {previewExtension && <ModelExtension isDarkMode={isDarkMode}>.{previewExtension}</ModelExtension>}
        </>
      );
    }

    const canInteract =
      !isPreview && !disableInteractions && (previewFileType === FileType.VIDEO || previewFileType === FileType.AUDIO);

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
        <SandboxedIframe hideUntilLoaded allowPointerEvents={!canInteract}>
          {previewContent}
        </SandboxedIframe>
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
    isDarkMode,
    blurPreview,
    previewCompactIcon,
  ]);

  const hasFile = !!preview;

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

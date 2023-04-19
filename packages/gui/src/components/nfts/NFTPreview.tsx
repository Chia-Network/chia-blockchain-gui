import { IconMessage, Loading, Flex, SandboxedIframe, usePersistState, useDarkMode } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { NotInterested /* , Error as ErrorIcon */ } from '@mui/icons-material';
import { Box } from '@mui/material';
import React, { useMemo, useRef, Fragment } from 'react';
import { renderToString } from 'react-dom/server';
import styled from 'styled-components';

import FileType from '../../@types/FileType';
import AudioSmallIcon from '../../assets/img/audio-small.svg';
import DocumentBlobIcon from '../../assets/img/document-blob.svg';
import DocumentSmallIcon from '../../assets/img/document-small.svg';
import DocumentPngIcon from '../../assets/img/document.png';
import DocumentPngDarkIcon from '../../assets/img/document_dark.png';
import ModelBlobIcon from '../../assets/img/model-blob.svg';
import ModelSmallIcon from '../../assets/img/model-small.svg';
import ModelPngIcon from '../../assets/img/model.png';
import ModelPngDarkIcon from '../../assets/img/model_dark.png';
import CompactIconSvg from '../../assets/img/nft-small-frame.svg';
import UnknownBlobIcon from '../../assets/img/unknown-blob.svg';
import UnknownSmallIcon from '../../assets/img/unknown-small.svg';
import UnknownPngIcon from '../../assets/img/unknown.png';
import UnknownPngDarkIcon from '../../assets/img/unknown_dark.png';
import VideoBlobIcon from '../../assets/img/video-blob.svg';
import VideoSmallIcon from '../../assets/img/video-small.svg';
import VideoPngIcon from '../../assets/img/video.png';
import VideoPngDarkIcon from '../../assets/img/video_dark.png';
import useHideObjectionableContent from '../../hooks/useHideObjectionableContent';
import useNFT from '../../hooks/useNFT';
import useNFTImageFittingMode from '../../hooks/useNFTImageFittingMode';
import useNFTMetadata from '../../hooks/useNFTMetadata';
import useNFTVerifyHash from '../../hooks/useNFTVerifyHash';
import getFileExtension from '../../util/getFileExtension';
import getFileType from '../../util/getFileType';
import getNFTId from '../../util/getNFTId';
import hasSensitiveContent from '../../util/hasSensitiveContent';
import parseFileContent from '../../util/parseFileContent';
import NFTHashStatus from './NFTHashStatus';

const StyledCardPreview = styled(Box)`
  height: ${({ height }) => height};
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
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
  background: ${(props) => (props.isDarkMode ? '#333' : '#fff')};
  box-shadow: 0px 0px 24px rgba(24, 162, 61, 0.5), 0px 4px 8px rgba(18, 99, 60, 0.32);
  border-radius: 32px;
  color: ${(props) => (props.isDarkMode ? '#fff' : '#333')};
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
        stop-color: ${(props) => (props.isDarkMode ? '#3C5E42' : '#DCFFBC')};
      }
      >stop: last-child {
        stop-color: ${(props) => (props.isDarkMode ? '#7EE890' : '#5ECE71')};
      }
    }
  }
  > img {
    position: relative;
  }
`;

const CompactIconFrame = styled.div`
  > svg:nth-child(2) {
    position: absolute;
    left: 23px;
    top: 14px;
    width: 32px;
    height: 32px;
  }
`;

const CompactIcon = styled(CompactIconSvg)`
  width: 66px;
  height: 66px;
  filter: drop-shadow(0px 2px 4px rgba(18 99 60 / 0.5));
  path {
    fill: #fff;
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
  font-size: 11px;
  color: #3aac59;
`;

export type NFTPreviewProps = {
  id: string;
  height?: number | string;
  width?: number | string;
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
    height = '300px',
    width = '100%',
    fit = nftImageFittingMode,
    background: Background = Fragment,
    preview: isPreview = false,
    isCompact = false,
    disableInteractions = false,
    icon = false,
    hideStatus = false,
  } = props;

  const nftId = useMemo(() => getNFTId(id), [id]);
  const iframeRef = useRef<any>(null);
  const { isDarkMode } = useDarkMode();
  const [hideObjectionableContent] = useHideObjectionableContent();
  const [ignoreSizeLimit /* , setIgnoreSizeLimit */] = usePersistState<boolean>(
    false,
    `nft-preview-ignore-size-limit-${nftId}`
  );

  const { preview, isLoading: isLoadingVerifyHash } = useNFTVerifyHash(nftId, {
    preview: isPreview,
    ignoreSizeLimit,
  });

  const { isLoading: isLoadingNFT } = useNFT(nftId);
  const { metadata, isLoading: isLoadingMetadata } = useNFTMetadata(nftId);
  const isLoading = isLoadingVerifyHash || isLoadingMetadata || isLoadingNFT;

  const blurPreview = useMemo(() => {
    if (!hideObjectionableContent) {
      return false;
    }

    if (isLoading) {
      return false;
    }

    if (metadata && !hasSensitiveContent(metadata)) {
      return false;
    }

    return true;
  }, [hideObjectionableContent, isLoading, metadata]);

  const previewExtension = useMemo(() => getFileExtension(preview?.originalUri), [preview]);

  const previewFileType = useMemo(() => {
    if (!preview?.originalUri) {
      return FileType.UNKNOWN;
    }

    const { originalUri } = preview;
    return getFileType(originalUri);
  }, [preview]);

  const srcDoc = useMemo(() => {
    if (!preview) {
      return undefined;
    }

    const style = `
    html, body {
      border: 0px;
      margin: 0px;
      padding: 0px;
      height: 100%;
      width: 100%;
      text-align: center;
    }

    body {
      overflow: hidden;
    }

    img {
      object-fit: ${fit};
    }

    #status-container {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      position: absolute;
        top: 0;
        width: 100%;
      }

      #status-pill {
        background-color: rgba(255, 255, 255, 0.4);
        backdrop-filter: blur(6px);
        border: 1px solid rgba(255, 255, 255, 0.13);
        border-radius: 16px;
        box-sizing: border-box;
        box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
        display: flex;
        height: 30px;
        margin-top: 20px;
        padding: 8px 20px;
      }

      #status-text {
        font-family: 'Roboto', sans-serif;
        font-style: normal;
        font-weight: 500;
        font-size: 12px;
        line-height: 14px;
      }
      audio {
        margin-top: 140px;
        box-shadow: 0px 0px 24px rgba(24, 162, 61, 0.5),
          0px 4px 8px rgba(18, 99, 60, 0.32);
        border-radius: 32px;
      }
      audio.dark::-webkit-media-controls-enclosure {
        background-color: #333;
      }
      audio.dark::-webkit-media-controls-current-time-display {
        color: #fff;
      }
      audio.dark::-webkit-media-controls-time-remaining-display {
        color: #fff;
      }
      audio.dark::-webkit-media-controls-mute-button {
        background-image: url('data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjZmZmIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxwYXRoIGQ9Ik0zIDl2Nmg0bDUgNVY0TDcgOUgzem0xMy41IDNjMC0xLjc3LTEuMDItMy4yOS0yLjUtNC4wM3Y4LjA1YzEuNDgtLjczIDIuNS0yLjI1IDIuNS00LjAyek0xNCAzLjIzdjIuMDZjMi44OS44NiA1IDMuNTQgNSA2Ljcxcy0yLjExIDUuODUtNSA2LjcxdjIuMDZjNC4wMS0uOTEgNy00LjQ5IDctOC43N3MtMi45OS03Ljg2LTctOC43N3oiLz4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+');
      }
      audio.dark::--webkit-media-controls-fullscreen-button {
        background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMjQgMjQiIHhtbDpzcGFjZT0icHJlc2VydmUiIGZpbGw9IldpbmRvd1RleHQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iNiIgcj0iMiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IiNmZmYiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjE4IiByPSIjZmZmIi8+PC9zdmc+');
      }
      audio.dark::-webkit-media-controls-toggle-closed-captions-button {
        display: none;
      }
      audio.dark::-webkit-media-controls-timeline {
            background: #444;
            border-radius: 4px;
            margin-left: 7px;
          }
        }
      }
      video::-webkit-media-controls {
          display: none;
      }
    `;

    let mediaElement = null;

    if (previewFileType === FileType.VIDEO) {
      mediaElement = (
        <video width="100%" height="100%" controls={!disableInteractions}>
          <source src={preview.uri} />
        </video>
      );
    } else if (previewFileType === FileType.AUDIO) {
      mediaElement = (
        <audio className={isDarkMode ? 'dark' : ''} controls={!disableInteractions}>
          <source src={preview.uri} />
        </audio>
      );
    } else {
      const isSVG = preview?.headers?.['content-type'].startsWith('image/svg+xml');
      if (isSVG && preview.content && preview.headers) {
        const svgImage = parseFileContent(preview.content, preview.headers);
        const encodedSvg = encodeURIComponent(svgImage);
        const dataUri = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
        mediaElement = <img src={dataUri} alt={t`Preview`} width="100%" height="100%" />;
      } else {
        mediaElement = <img src={preview.uri} alt={t`Preview`} width="100%" height="100%" />;
      }
    }

    return renderToString(
      <html>
        <head>
          <style dangerouslySetInnerHTML={{ __html: style }} />
        </head>
        <body>{mediaElement}</body>
      </html>
    );
  }, [preview, previewFileType, disableInteractions, isDarkMode, fit]);

  const previewCompactIcon = useMemo(() => {
    switch (previewFileType) {
      /*
      case FileType.IMAGE:
        return <CompactImageIcon />;
        */
      case FileType.VIDEO:
        return <CompactVideoIcon />;
      case FileType.AUDIO:
        return <CompactAudioIcon />;
      case FileType.MODEL:
        return <CompactModelIcon />;
      case FileType.DOCUMENT:
        return <CompactDocumentIcon />;
      default: {
        if (previewExtension) {
          return <CompactExtension>.{previewExtension}</CompactExtension>;
        }

        return <CompactUnknownIcon />;
      }
    }
  }, [previewFileType, previewExtension]);

  /*
  function handleIgnoreError(event: any) {
    event.stopPropagation();

    setIgnoreSizeLimit(true);
  }
  */

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
    if (!preview?.isVerified) {
      return null;
    }

    if (isCompact && previewFileType !== FileType.IMAGE) {
      return (
        <CompactIconFrame>
          <CompactIcon />
          {previewCompactIcon}
        </CompactIconFrame>
      );
    }

    if (icon) {
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
        <SandboxedIframe srcDoc={srcDoc} height={height} hideUntilLoaded allowPointerEvents />
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
    preview,
    isPreview,
    isCompact,
    previewFileType,
    height,
    disableInteractions,
    previewIcon,
    icon,
    previewExtension,
    srcDoc,
    iframeRef,
    isDarkMode,
    blurPreview,
    previewCompactIcon,
  ]);

  const hasFile = !!preview;

  return (
    <StyledCardPreview height={isCompact ? '50px' : height} width={width}>
      {isLoading ? (
        <Flex position="absolute" left="0" top="0" bottom="0" right="0" justifyContent="center" alignItems="center">
          <Loading center>{!isCompact && <Trans>{isPreview ? 'Loading preview...' : 'Loading NFT...'}</Trans>}</Loading>
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

/*
{isCompact ? null : !hasFile ? (
        <Background>
          <IconMessage icon={<NotInterested fontSize="large" />}>
            <Trans>No file available</Trans>
          </IconMessage>
        </Background>
      ) : !isUrlValid ? (
        <IconMessage icon={<ErrorIcon fontSize="large" />}>
          <Trans>Preview URL is not valid</Trans>
        </IconMessage>
      ) : nft.pendingTransaction ? (
        <ThumbnailError>
          <Trans>Update Pending</Trans>
        </ThumbnailError>
      ) : error === 'thumbnail hash mismatch' ? (
        <ThumbnailError>
          <Trans>Thumbnail hash mismatch</Trans>
        </ThumbnailError>
      ) : error === 'Hash mismatch' && isPreview ? (
        <ThumbnailError>
          <Trans>Image Hash Mismatch</Trans>
        </ThumbnailError>
      ) : error === 'missing preview_video_hash' ? (
        <ThumbnailError>
          <Trans>Missing preview_video_hash key</Trans>
        </ThumbnailError>
      ) : error === 'missing preview_image_hash' ? (
        <ThumbnailError>
          <Trans>Missing preview_image_hash key</Trans>
        </ThumbnailError>
      ) : error === 'failed fetch content' ? (
        <ThumbnailError>
          <Trans>Error fetching video preview</Trans>
        </ThumbnailError>
      ) : metadataError === 'Metadata hash mismatch' ? (
        <ThumbnailError>
          <Trans>Metadata hash mismatch</Trans>
        </ThumbnailError>
      ) : metadataError === 'Invalid URI' || (metadataError && metadataError.indexOf('getaddrinfo ENOTFOUND') > -1) ? (
        <ThumbnailError>
          <Trans>Invalid metadata url</Trans>
        </ThumbnailError>
      ) : error === 'Error parsing json' ? (
        <ThumbnailError>
          <Trans>Error parsing json</Trans>
        </ThumbnailError>
      ) : responseTooLarge(error) && !ignoreError ? (
        <Background>
          <Flex direction="column" gap={2}>
            <IconMessage icon={<ErrorIcon fontSize="large" />}>
              <Trans>Response too large</Trans>
            </IconMessage>
            {error !== 'url is not defined' && (
              <Button onClick={handleIgnoreError} variant="outlined" size="small" color="secondary">
                <Trans>Show Preview</Trans>
              </Button>
            )}
          </Flex>
        </Background>
      ) : null}
      */

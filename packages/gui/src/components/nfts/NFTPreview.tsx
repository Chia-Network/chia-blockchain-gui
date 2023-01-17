import { type NFTInfo } from '@chia-network/api';
import { IconMessage, Loading, Flex, SandboxedIframe, Tooltip, usePersistState, useDarkMode } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { NotInterested, Error as ErrorIcon } from '@mui/icons-material';
import CloseSvg from '@mui/icons-material/Close';
import QuestionMarkSvg from '@mui/icons-material/QuestionMark';
import { Box, Button, Typography } from '@mui/material';
import mime from 'mime-types';
import React, { useMemo, useState, useRef, Fragment } from 'react';
import { renderToString } from 'react-dom/server';
import styled from 'styled-components';
import isURL from 'validator/lib/isURL';

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
import useNFTImageFittingMode from '../../hooks/useNFTImageFittingMode';
import useVerifyHash from '../../hooks/useVerifyHash';
import { isImage, parseExtensionFromUrl } from '../../util/utils';

function responseTooLarge(error) {
  return error === 'Response too large';
}

const StyledCardPreview = styled(Box)`
  height: ${({ height }) => height};
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const IframeWrapper = styled.div`
  padding: 0;
  margin: 0;
  height: 100%;
  width: 100%;
  position: relative;
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

const StatusContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  height: 100%;
  z-index: 3;
`;

const StatusPill = styled.div`
  background-color: ${({ theme }) =>
    theme.palette.mode === 'dark' ? 'rgba(50, 50, 50, 0.4)' : 'rgba(255, 255, 255, 0.4)'};
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 16px;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  display: flex;
  height: 30px;
  margin-top: -200px;
  padding: 8px 20px;
`;

const StatusText = styled.div`
  font-family: 'Roboto', sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  text-shadow: 0px 1px 4px black;
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

const Sha256ValidatedIcon = styled.div`
  position: absolute;
  background: ${({ theme }) => (theme.palette.mode === 'dark' ? 'rgba(33, 33, 33, 0.5)' : 'rgba(255, 255, 255, 0.66)')};
  color: ${({ theme }) => (theme.palette.mode === 'dark' ? '#fff' : '#333')};
  border-radius: 18px;
  padding: 0 8px;
  top: 10px;
  left: 10px;
  z-index: 3;
  line-height: 25px;
  box-shadow: 0 0 2px 0 #ccc;
  font-size: 11px;
  > * {
    vertical-align: top;
  }
  svg {
    position: relative;
    top: 2px;
    width: 20px;
    height: 20px;
    margin-left: -3px;
    margin-right: -3px;
  }
`;

const CloseIcon = styled(CloseSvg)`
  path {
    fill: red;
  }
`;

const QuestionMarkIcon = styled(QuestionMarkSvg)`
  path {
    fill: grey;
  }
`;

export type NFTPreviewProps = {
  nft: NFTInfo;
  height?: number | string;
  width?: number | string;
  fit?: 'cover' | 'contain' | 'fill';
  background?: any;
  isPreview?: boolean;
  disableThumbnail?: boolean;
  isCompact?: boolean;
  miniThumb?: boolean;
  setNFTCardMetadata: (obj: any) => void;
};

function ThumbnailError({ children }: any) {
  return (
    <StatusContainer>
      <StatusPill>
        <StatusText>{children}</StatusText>
      </StatusPill>
    </StatusContainer>
  );
}

// ======================================================================= //
// NFTPreview function
// ======================================================================= //
export default function NFTPreview(props: NFTPreviewProps) {
  const [nftImageFittingMode] = useNFTImageFittingMode();
  const {
    nft,
    nft: { dataUris },
    height = '300px',
    width = '100%',
    fit = nftImageFittingMode,
    background: Background = Fragment,
    isPreview = false,
    isCompact = false,
    disableThumbnail = false,
    miniThumb,
    setNFTCardMetadata,
  } = props;

  const hasFile = dataUris?.length > 0;
  const file = dataUris?.[0];
  let extension = '';

  try {
    [extension] = new URL(file).pathname.split('.').slice(-1);
    if (!extension.match(/^[a-zA-Z0-9]+$/)) {
      extension = '';
    }
  } catch (e) {
    console.error(`Failed to check file extension for ${file}: ${e}`);
  }

  const [ignoreSizeLimit, setIgnoreSizeLimit] = usePersistState<boolean>(
    false,
    `nft-preview-ignore-size-limit-${nft.$nftId}-${file}`
  );

  const [loaded, setLoaded] = useState(false);

  const [metadataError, setNFTPreviewMetadataError] = useState<string | undefined>(undefined);

  const { isLoading, error, thumbnail, isValid } = useVerifyHash({
    nft,
    ignoreSizeLimit,
    isPreview,
    dataHash: nft.dataHash,
    nftId: nft.$nftId,
    setNFTCardMetadata,
    setNFTPreviewMetadataError,
  });

  const [ignoreError, setIgnoreError] = usePersistState<boolean>(
    false,
    `nft-preview-ignore-error-${nft.$nftId}-${file}`
  );

  const iframeRef = useRef<any>(null);

  const isUrlValid = useMemo(() => {
    if (!file) {
      return false;
    }

    return isURL(file);
  }, [file]);

  const { isDarkMode } = useDarkMode();

  const mimeType = React.useCallback((): string => {
    let pathName = '';
    try {
      pathName = new URL(file).pathname;
    } catch (e) {
      console.error(`Failed to check file extension for ${file}: ${e}`);
    }
    return mime.lookup(pathName) || '';
  }, [file]);

  const isAudio = React.useCallback(
    () =>
      mimeType().match(/^audio/) &&
      (!isPreview || (isPreview && !thumbnail.video && !thumbnail.image) || disableThumbnail),
    [isPreview, thumbnail?.video, thumbnail?.image, disableThumbnail, mimeType]
  );

  const [srcDoc] = useMemo(() => {
    if (!file) {
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

    if (thumbnail.image) {
      mediaElement = <img src={thumbnail.image} alt={t`Preview`} width="100%" height="100%" />;
    } else if (mimeType().match(/^video/)) {
      mediaElement = (
        <video width="100%" height="100%">
          <source src={thumbnail.binary || file} />
        </video>
      );
    } else if (parseExtensionFromUrl(file) === 'svg') {
      /* cached svg exception */
      mediaElement = <div id="replace-with-svg" />;
    } else {
      mediaElement = <img src={thumbnail.binary || file} alt={t`Preview`} width="100%" height="100%" />;
    }

    if (isPreview && thumbnail.video && !disableThumbnail && !miniThumb) {
      mediaElement = (
        <video width="100%" height="100%" controls>
          <source src={thumbnail.video} />
        </video>
      );
    }

    if (isAudio()) {
      mediaElement = (
        <audio className={isDarkMode ? 'dark' : ''} controls>
          <source src={thumbnail.binary || file} />
        </audio>
      );
    }

    let elem = renderToString(
      <html>
        <head>
          <style dangerouslySetInnerHTML={{ __html: style }} />
        </head>
        <body>{mediaElement}</body>
      </html>
    );

    /* cached svg exception */
    elem = elem.replace(`<div id="replace-with-svg"></div>`, thumbnail.binary);

    return [elem];
  }, [file, thumbnail, disableThumbnail, fit, isPreview, isAudio, isDarkMode, mimeType, miniThumb]);

  const handleLoadedChange = React.useCallback((loadedValue: any) => {
    setLoaded(loadedValue);
  }, []);

  function handleIgnoreError(event: any) {
    event.stopPropagation();

    setIgnoreError(true);
    if (responseTooLarge(error)) {
      setIgnoreSizeLimit(true);
    }
  }

  function isDocument() {
    return ['pdf', 'docx', 'doc', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'].indexOf(extension) > -1;
  }

  function renderCompactIcon() {
    return (
      <>
        {mimeType().match(/^video/) && <CompactVideoIcon />}
        {mimeType().match(/^audio/) && <CompactAudioIcon />}
        {mimeType().match(/^model/) && <CompactModelIcon />}
        {isDocument() && <CompactDocumentIcon />}
        {isUnknownType() && <CompactUnknownIcon />}
        {extension && <CompactExtension>.{extension}</CompactExtension>}
      </>
    );
  }

  function renderCompactIconWrapper() {
    if (miniThumb) {
      return renderCompactIcon();
    }
    return (
      <CompactIconFrame>
        <CompactIcon />
        {renderCompactIcon()}
      </CompactIconFrame>
    );
  }

  function renderNftIcon() {
    if (isDocument()) {
      return (
        <BlobBg isDarkMode={isDarkMode}>
          <DocumentBlobIcon />
          <img src={isDarkMode ? DocumentPngDarkIcon : DocumentPngIcon} />
        </BlobBg>
      );
    }
    if (mimeType().match(/^model/)) {
      return (
        <BlobBg isDarkMode={isDarkMode}>
          <ModelBlobIcon />
          <img src={isDarkMode ? ModelPngDarkIcon : ModelPngIcon} />
        </BlobBg>
      );
    }
    if (mimeType().match(/^video/)) {
      return (
        <BlobBg isDarkMode={isDarkMode}>
          <VideoBlobIcon />
          <img src={isDarkMode ? VideoPngDarkIcon : VideoPngIcon} />
        </BlobBg>
      );
    }
    return (
      <BlobBg isDarkMode={isDarkMode}>
        <UnknownBlobIcon />
        <img src={isDarkMode ? UnknownPngDarkIcon : UnknownPngIcon} />;
      </BlobBg>
    );
  }

  function isUnknownType() {
    return (
      !isDocument() &&
      !mimeType().match(/^audio/) &&
      !mimeType().match(/^video/) &&
      !mimeType().match(/^model/) &&
      !isImage(file)
    );
  }

  function renderElementPreview() {
    if (!isUrlValid) {
      return null;
    }

    if (isCompact && !isImage(file)) {
      return renderCompactIconWrapper();
    }

    const isOfferNft = disableThumbnail && !mimeType().match(/^video/) && !mimeType().match(/^audio/) && !isImage(file);

    const isPreviewNft =
      mimeType() !== '' &&
      !isImage(file) &&
      !thumbnail.video &&
      !thumbnail.image &&
      !mimeType().match(/^audio/) &&
      isPreview &&
      !disableThumbnail;

    const notPreviewNft =
      !disableThumbnail && !isPreview && (mimeType().match(/^model/) || isDocument() || isUnknownType());

    if (isOfferNft || isPreviewNft || notPreviewNft) {
      return (
        <>
          {renderNftIcon()}
          {extension && <ModelExtension isDarkMode={isDarkMode}>.{extension}</ModelExtension>}
        </>
      );
    }

    return (
      <IframeWrapper ref={iframeRef}>
        {isPreview && !thumbnail.video && !isAudio() && <IframePreventEvents />}
        <SandboxedIframe
          srcDoc={srcDoc}
          height={height}
          onLoadedChange={handleLoadedChange}
          hideUntilLoaded
          allowPointerEvents
          miniThumb={miniThumb}
        />
      </IframeWrapper>
    );
  }

  function renderIsHashValid() {
    if (isValid || miniThumb) return null;
    let icon = null;
    let tooltipString = null;

    if (isPreview) {
      if (isValid === undefined) {
        icon = <QuestionMarkIcon />;
        tooltipString = t`Content has not been validated against the hash that was specified during NFT minting.`;
      } else if (!isValid) {
        icon = <CloseIcon />;
        tooltipString = t`Content does not match the expected hash value that was specified during NFT minting. The content may have been modified.`;
      }
    }

    if (icon && tooltipString) {
      return (
        <Tooltip title={<Typography variant="caption">{tooltipString}</Typography>}>
          <Sha256ValidatedIcon>{icon} HASH</Sha256ValidatedIcon>
        </Tooltip>
      );
    }
    return null;
  }

  const showLoading = isLoading;

  return (
    <StyledCardPreview height={miniThumb ? '50px' : height} width={width}>
      {renderIsHashValid()}
      {miniThumb ? null : !hasFile ? (
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
      <>
        {(showLoading ||
          (!loaded && isImage(file) && !thumbnail.image && !thumbnail.video) ||
          (!isPreview && !loaded && isImage(file))) &&
          !responseTooLarge(error) &&
          isUrlValid && (
            <Flex position="absolute" left="0" top="0" bottom="0" right="0" justifyContent="center" alignItems="center">
              <Loading center>
                {!miniThumb && <Trans>{isPreview ? 'Loading preview...' : 'Loading NFT...'}</Trans>}
              </Loading>
            </Flex>
          )}
        {!showLoading && !responseTooLarge(error) && renderElementPreview()}
      </>
    </StyledCardPreview>
  );
}

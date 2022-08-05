import React, { useMemo, useState, type ReactNode, Fragment } from 'react';
import { renderToString } from 'react-dom/server';
import mime from 'mime-types';
import { t, Trans } from '@lingui/macro';
import { Box, Button } from '@mui/material';
import {
  NotInterested,
  Error as ErrorIcon,
  ConstructionOutlined,
} from '@mui/icons-material';

import {
  IconMessage,
  Loading,
  Flex,
  SandboxedIframe,
  usePersistState,
} from '@chia/core';
import styled from 'styled-components';
import { type NFTInfo } from '@chia/api';
import isURL from 'validator/lib/isURL';
import useNFTHash from '../../hooks/useNFTHash';
import NFTProgressBar from './NFTProgressBar';
import VideoSvg from '../../assets/img/nft_video.svg';

function prepareErrorMessage(error: Error): ReactNode {
  if (error.message === 'Response too large') {
    return <Trans>File is over 10MB</Trans>;
  }

  return error.message;
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

const ProgressBarContainer = styled.div`
  width: 80%;
  padding: 15px;
`;

const ProgressBarText = styled.div`
  text-align: center;
`;

const ThumbnailError = styled.div`
  color: red;
  text-align: center;
`;

const VideoIcon = styled(VideoSvg)`
  width: 100px;
  height: 100px;
`;

export type NFTPreviewProps = {
  nft: NFTInfo;
  height?: number | string;
  width?: number | string;
  fit?: 'cover' | 'contain' | 'fill';
  elevate?: boolean;
  background?: any;
  hideStatusBar?: boolean;
  isPreview?: boolean;
};

export default function NFTPreview(props: NFTPreviewProps) {
  const {
    nft,
    nft: { dataUris },
    height = '300px',
    width = '100%',
    fit = 'cover',
    background: Background = Fragment,
    hideStatusBar = false,
    isPreview = false,
  } = props;

  const hasFile = dataUris?.length > 0;
  const file = dataUris?.[0];

  const [loaded, setLoaded] = useState(false);
  const { isValid, isLoading, error, thumbnail } = useNFTHash(nft, isPreview);

  const [ignoreError, setIgnoreError] = usePersistState<boolean>(
    false,
    `nft-preview-ignore-error-${nft.$nftId}-${file}`,
  );
  const [thumbnailProgress, setThumbnailProgress] = useState(-1);
  const [thumbnailError, setThumbnailError] = useState('');

  const isUrlValid = useMemo(() => {
    if (!file) {
      return false;
    }

    return isURL(file);
  }, [file]);

  const [statusText, isStatusError] = useMemo(() => {
    if (nft.pendingTransaction) {
      return [t`Update Pending`, false];
    } else if (error?.message === 'Hash mismatch') {
      return [t`Image Hash Mismatch`, true];
    }
    return [undefined, false];
  }, [nft, isValid, error]);

  const srcDoc = useMemo(() => {
    if (!file) {
      return;
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
      }
    `;

    let mediaElement = null;
    const pathName: string = new URL(file).pathname;
    const mimeType = mime.lookup(pathName);
    if (thumbnail.video) {
      mediaElement = (
        <video width="100%" height="100%">
          <source src={thumbnail.video} type={mimeType} />
        </video>
      );
    } else if (thumbnail.image) {
      mediaElement = (
        <img
          src={thumbnail.image}
          alt={t`Preview`}
          width="100%"
          height="100%"
        />
      );
    } else if (mimeType.match(/^audio/)) {
      mediaElement = (
        <audio controls>
          <source src={file} type={mimeType} />
        </audio>
      );
    } else if (mimeType.match(/^video/)) {
      mediaElement = (
        <video controls width="100%" height="100%">
          <source src={thumbnail.uri} type="video/mp4" />
        </video>
      );
    } else {
      mediaElement = (
        <img src={file} alt={t`Preview`} width="100%" height="100%" />
      );
    }

    return renderToString(
      <html>
        <head>
          <style dangerouslySetInnerHTML={{ __html: style }} />
        </head>
        <body>
          {mediaElement}
          {statusText && !hideStatusBar && (
            <div id="status-container">
              <div id="status-pill">
                <span id="status-text">{statusText}</span>
              </div>
            </div>
          )}
        </body>
      </html>,
    );
  }, [file, statusText, isStatusError, thumbnail]);

  function handleLoadedChange(loadedValue) {
    setLoaded(loadedValue);
  }

  function handleIgnoreError(event) {
    event.stopPropagation();

    setIgnoreError(true);
  }

  function renderMediaElementInsideIframe() {
    if (isPreview) {
      if (thumbnail.type === 'audio') {
        const pathName: string = new URL(file).pathname;
        const mimeType = mime.lookup(pathName);
        return (
          <>
            <audio controls>
              <source src={file} type={mimeType} />
            </audio>
          </>
        );
      }
      if (
        thumbnail.type === 'video' &&
        !thumbnail.image &&
        !thumbnail.video &&
        !thumbnail.error
      ) {
        return <VideoIcon />;
      }
      if (thumbnail.error) {
        return (
          <ThumbnailError>
            <Trans>Error parsing json.</Trans>
          </ThumbnailError>
        );
      }
    }

    return (
      <SandboxedIframe
        srcDoc={srcDoc}
        height={height}
        onLoadedChange={handleLoadedChange}
        hideUntilLoaded
      />
    );
  }

  return (
    <StyledCardPreview height={height} width={width}>
      {!hasFile ? (
        <Background>
          <IconMessage icon={<NotInterested fontSize="large" />}>
            <Trans>No file available</Trans>
          </IconMessage>
        </Background>
      ) : !isUrlValid ? (
        <Background>
          <IconMessage icon={<ErrorIcon fontSize="large" />}>
            <Trans>Preview URL is not valid</Trans>
          </IconMessage>
        </Background>
      ) : thumbnailError !== '' ? (
        <ThumbnailError>{thumbnailError}</ThumbnailError>
      ) : thumbnailProgress > -1 ? (
        <ProgressBarContainer>
          <ProgressBarText>
            <Trans>Generating video preview</Trans>
          </ProgressBarText>
          <NFTProgressBar percentage={thumbnailProgress} />
        </ProgressBarContainer>
      ) : isLoading ? (
        <Background>
          <Loading center>
            <Trans>Loading preview...</Trans>
          </Loading>
        </Background>
      ) : error && !isStatusError && !ignoreError ? (
        <Background>
          <Flex direction="column" gap={2}>
            <IconMessage icon={<ErrorIcon fontSize="large" />}>
              {prepareErrorMessage(error)}
            </IconMessage>
            <Button
              onClick={handleIgnoreError}
              variant="outlined"
              size="small"
              color="secondary"
            >
              <Trans>Show Preview</Trans>
            </Button>
          </Flex>
        </Background>
      ) : (
        <>
          {!loaded && Object.keys(thumbnail).length === 0 && (
            <Flex
              position="absolute"
              left="0"
              top="0"
              bottom="0"
              right="0"
              justifyContent="center"
              alignItems="center"
            >
              <Loading center>
                <Trans>Loading preview...</Trans>
              </Loading>
            </Flex>
          )}
          {renderMediaElementInsideIframe()}
        </>
      )}
    </StyledCardPreview>
  );
}

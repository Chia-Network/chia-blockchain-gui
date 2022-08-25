import React, {
  useMemo,
  useState,
  useRef,
  type ReactNode,
  Fragment,
  useEffect,
} from 'react';
import { renderToString } from 'react-dom/server';
import mime from 'mime-types';
import { t, Trans } from '@lingui/macro';
import { Box, Button } from '@mui/material';
import { NotInterested, Error as ErrorIcon } from '@mui/icons-material';

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
import VideoSvg from '../../assets/img/nft_video.svg';
import AudioSvg from '../../assets/img/audio.svg';
import AudioIconPng from '../../assets/img/audio.png';
import ModelSvg from '../../assets/img/3dModel.svg';
import UnknownSvg from '../../assets/img/unknown.svg';
import DocumentSvg from '../../assets/img/document.svg';

const supportedFileTypes: any = {
  images: ['jpg', 'gif', 'svg', 'png'],
  video: ['mp4', 'webm', 'mkv'],
  audio: ['mp3', 'ogg', 'wav', 'flac', 'aac'],
  '3d': ['gltf', 'glb', 'stl'],
  documents: ['pdf', 'docx', 'doc', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'],
};

function prepareErrorMessage(error: string | undefined): ReactNode {
  if (error === 'Response too large') {
    return <Trans>File is over 10MB</Trans>;
  }
  return error;
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

const ThumbnailError = styled.div`
  color: red;
  text-align: center;
`;

const VideoIcon = styled(VideoSvg)`
  width: 100px;
  height: 100px;
`;

const ModelIcon = styled(ModelSvg)`
  width: 100px;
  height: 100px;
`;

const UnknownIcon = styled(UnknownSvg)`
  width: 100px;
  height: 100px;
`;

const DocumentIcon = styled(DocumentSvg)`
  width: 100px;
  height: 100px;
`;

const AudioWrapper = styled.div`
  height: 100%;
  width: 100%;
  background-image: url('${AudioIconPng}');
  background-size: 100% 100%;
  text-align: center;
  > audio + svg {
    margin-top: 20px;
  }
  audio {
    position: absolute;
    margin-left: auto;
    margin-right: auto;
    left: 0;
    right: 0;
    bottom: 20px;
    text-align: center;
    // box-shadow: 0 3px 15px #000;
    border-radius: 30px;
  }
`;

const AudioIconWrapper = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  background: #fff;
  width: 54px;
  height: 54px;
  border-radius: 30px;
  background: #f4f4f4;
  text-align: center;
  margin-left: auto;
  margin-right: auto;
  right: 247px;
  line-height: 66px;
  transition: right 0.25s linear, width 0.25s linear, opacity 0.25s;
  visibility: visible;
  &.transition {
    width: 300px;
    right: 0px;
    transition: right 0.25s linear, width 0.25s linear;
  }
  &.hide {
    visibility: hidden;
  }
`;

const AudioIcon = styled(AudioSvg)`
  // float:
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

const ModelExtension = styled.div`
  text-transform: uppercase;
  margin-top: 10px;
  font-size: 16px;
`;

const AudioControls = styled.div`
  visibility: hidden;
  &.transition {
    visibility: visible;
  }
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

let loopImageInterval: any;
let isPlaying: boolean = false;

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
  const [showAudioTag, setShowAudioTag] = useState(false);

  const [ignoreError, setIgnoreError] = usePersistState<boolean>(
    false,
    `nft-preview-ignore-error-${nft.$nftId}-${file}`,
  );

  const iframeRef = useRef<any>(null);
  const audioIconRef = useRef<any>(null);
  const audioControlsRef = useRef<any>(null);

  const isUrlValid = useMemo(() => {
    if (!file) {
      return false;
    }

    return isURL(file);
  }, [file]);

  const [statusText, isStatusError] = useMemo(() => {
    if (nft.pendingTransaction) {
      return [t`Update Pending`, false];
    } else if (error === 'Hash mismatch') {
      return [t`Image Hash Mismatch`, true];
    }
    return [undefined, false];
  }, [nft, isValid, error]);

  const srcDoc = useMemo(() => {
    if (!file) {
      return;
    }

    const hideVideoCss = isPreview
      ? `
      video::-webkit-media-controls {
        display: none !important;
      }   
    `
      : '';

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
      ${hideVideoCss}
    `;

    let mediaElement = null;
    if (thumbnail.video) {
      mediaElement = (
        <video width="100%" height="100%">
          <source src={thumbnail.video} />
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
    } else if (mimeType().match(/^audio/)) {
      mediaElement = (
        <>
          <audio controls>
            <source src={file} />
          </audio>
        </>
      );
    } else if (mimeType().match(/^video/)) {
      mediaElement = (
        <video width="100%" height="100%">
          <source src={thumbnail.uri} />
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
  }, [file, statusText, isStatusError, thumbnail, error]);

  function mimeType() {
    const pathName: string = new URL(file).pathname;
    return mime.lookup(pathName);
  }

  function getVideoDOM() {
    const iframe =
      iframeRef.current && iframeRef.current.querySelector('iframe');
    if (iframe) {
      return iframe.contentWindow.document.querySelector('video');
    }
    return null;
  }

  function stopVideo() {
    const video = getVideoDOM();
    if (video) {
      video.controls = false;
      video.pause();
    }
  }

  function hideVideoControls() {
    const video = getVideoDOM();
    if (video) {
      video.controls = false;
      video.removeAttribute('controls');
      video.playsInline = true;
    }
  }

  function handleLoadedChange(loadedValue: any) {
    setLoaded(loadedValue);
    if (thumbnail.video) {
      hideVideoControls();
    }
  }

  function handleIgnoreError(event: any) {
    event.stopPropagation();

    setIgnoreError(true);
  }

  function renderAudioTag() {
    return (
      <AudioControls ref={audioControlsRef}>
        <audio controls>
          <source src={file} />
        </audio>
      </AudioControls>
    );
  }

  function renderAudioIcon() {
    return (
      <AudioIconWrapper ref={audioIconRef}>
        <AudioIcon />
      </AudioIconWrapper>
    );
  }

  function audioMouseEnter(e: any) {
    if (!isPlaying) {
      if (audioIconRef.current)
        audioIconRef.current.classList.add('transition');
      setTimeout(() => {
        if (audioControlsRef.current)
          audioControlsRef.current.classList.add('transition');
        if (audioIconRef.current) audioIconRef.current.classList.add('hide');
      }, 250);
    }
  }

  function audioMouseLeave(e: any) {
    if (!isPlaying) {
      if (audioIconRef.current) {
        audioIconRef.current.classList.remove('transition');
        audioIconRef.current.classList.remove('hide');
      }
      if (audioControlsRef.current) {
        audioControlsRef.current.classList.remove('transition');
      }
    }
  }

  function audioPlayEvent(e: any) {
    isPlaying = true;
  }

  function audioPauseEvent(e: any) {
    isPlaying = false;
  }

  function iframeMouseEnter(e: any) {
    e.stopPropagation();
    e.preventDefault();
    const videoDOM = getVideoDOM();
    if (isPreview && thumbnail.video && videoDOM) {
      videoDOM.play();
    }
  }

  function iframeMouseLeave() {
    if (isPreview && thumbnail.video) {
      stopVideo();
    }
    if (thumbnail.images) {
      clearTimeout(loopImageInterval);
    }
  }

  function renderElementPreview() {
    const isThumbnail = thumbnail.video || thumbnail.image;
    const extension: string = new URL(file).pathname.split('.').slice(-1)[0];
    const allSupportedExtensionsArray: string[] = Object.keys(
      supportedFileTypes,
    ).reduce((p, c) => {
      return p.concat(supportedFileTypes[c]);
    }, []);
    if (allSupportedExtensionsArray.indexOf(extension) === -1) {
      return (
        <>
          <UnknownIcon />
          <ModelExtension>{extension}</ModelExtension>
        </>
      );
    }
    if (mimeType().match(/^model/) && !isThumbnail) {
      return (
        <>
          <ModelIcon />
          <ModelExtension>{extension}</ModelExtension>
        </>
      );
    } else if (
      [
        'pdf',
        'docx',
        'doc',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
        'txt',
        'rtf',
      ].indexOf(extension) > -1
    ) {
      return (
        <>
          <DocumentIcon />
          <ModelExtension>{extension}</ModelExtension>
        </>
      );
    }

    if (isPreview) {
      if (thumbnail.type === 'audio') {
        // const pathName: string = new URL(file).pathname;
        return (
          <AudioWrapper
            onMouseEnter={audioMouseEnter}
            onMouseLeave={audioMouseLeave}
            onPlay={audioPlayEvent}
            onPause={audioPauseEvent}
            isPlaying={isPlaying}
          >
            {renderAudioTag()}
            {renderAudioIcon()}
          </AudioWrapper>
        );
      } else if (
        thumbnail.type === 'video' &&
        !thumbnail.image &&
        !thumbnail.video &&
        !thumbnail.error
      ) {
        return <VideoIcon />;
      }
    }

    return (
      <IframeWrapper
        ref={iframeRef}
        onMouseEnter={iframeMouseEnter}
        onMouseLeave={iframeMouseLeave}
      >
        {isPreview && <IframePreventEvents />}
        <SandboxedIframe
          srcDoc={srcDoc}
          height={height}
          onLoadedChange={handleLoadedChange}
          hideUntilLoaded
        />
      </IframeWrapper>
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
      ) : error === 'thumbnail hash mismatch' ? (
        <ThumbnailError>
          <Trans>Thumbnail hash mismatch</Trans>
        </ThumbnailError>
      ) : error === 'Error parsing json' ? (
        <ThumbnailError>
          <Trans>Error parsing json</Trans>
        </ThumbnailError>
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
          {renderElementPreview()}
        </>
      )}
    </StyledCardPreview>
  );
}

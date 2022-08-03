import { useEffect, useState } from 'react';
import type NFTInfo from '@chia/api';
import useVerifyURIHash from './useVerifyURIHash';
import mime from 'mime-types';

interface Thumbnail {
  uri: string;
  filePath: string;
  type: string;
}

function mimeType(uri: string, regexp: RegExp) {
  const urlOnly = new URL(uri).origin + new URL(uri).pathname;
  const temp = mime.lookup(urlOnly);
  return temp.match(regexp);
}

function isAudioOrVideo(uri: string) {
  return mimeType(uri, /^video|^audio/);
}

function isAudio(uri: string) {
  return mimeType(uri, /^audio/);
}

export default function useNFTHash(nft: NFTInfo, isPreview: boolean) {
  const { dataHash, dataUris } = nft;
  const uri = dataUris?.[0];
  const [thumbnail, setThumbnail] = useState({});

  function handleThumbnail(_event: any, thumbnail: Thumbnail) {
    if (thumbnail.uri === uri) {
      if (thumbnail.type === 'audio') {
        setThumbnail(thumbnail);
      } else if (thumbnail.type === 'video') {
        setThumbnail({
          filePath: thumbnail.filePath,
          uri: thumbnail.uri,
          type: thumbnail.type,
        });
      }
    }
  }

  useEffect(() => {
    const mimeType = mime.lookup(uri);
    if (isPreview || (uri && mimeType && mimeType.match(/^audio/))) {
      (window as any).ipcRenderer.on('thumbnail', handleThumbnail);
      if (uri && mimeType && mimeType.match(/^video|^audio/)) {
        (window as any).ipcRenderer.invoke('get-thumbnail', {
          file: uri,
          mimeType,
        });
      }
    }
    return () => {
      (window as any).ipcRenderer.off('thumbnail', handleThumbnail);
    };
  }, []);

  if (uri) {
    if (isPreview || isAudio(uri)) {
      if (!isAudioOrVideo(uri)) {
        return {
          isValid: true,
          isLoading: false,
          error: null,
          thumbnail: {},
          uri,
        };
      } else {
        return {
          isValid: true,
          isLoading: Object.keys(thumbnail).length === 0,
          thumbnail,
          error: null,
        };
      }
    } else {
      /* DETAIL!!! */
      if (isAudioOrVideo(uri)) {
        return {
          isValid: true,
          isLoading: false,
          uri,
          thumbnail: {
            uri,
          },
        };
      }
    }
  }

  return useVerifyURIHash(uri, dataHash);
}

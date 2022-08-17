import { useEffect, useState } from 'react';
import mime from 'mime-types';

interface Thumbnail {
  uri: string;
  filePath: string;
  type: string;
}

function mimeTypeRegex(uri: string, regexp: RegExp) {
  const urlOnly = new URL(uri).origin + new URL(uri).pathname;
  const temp = mime.lookup(urlOnly);
  return ((temp || '') as string).match(regexp);
}

function isAudio(uri: string) {
  return mimeTypeRegex(uri, /^audio/);
}

function isVideo(uri: string) {
  return mimeTypeRegex(uri, /^video/);
}

/**
 * Fetch json text from url
 */
function useLoadingPreview(nft: any) {
  const [json, setJson] = useState({});
  useEffect(() => {
    if (nft && Array.isArray(nft.metadataUris) && nft.metadataUris.length) {
      fetch(nft.metadataUris[0])
        .then((response) => {
          return response.text();
        })
        .then((data) => {
          let json;
          try {
            json = JSON.parse(data);
          } catch (e) {
            setJson({
              error: 'Error parsing json',
            });
          }
          if (json) {
            setJson(json);
          }
        });
    }
  }, []);
  return json;
}

export default function useNFTHash(nft: any, isPreview: boolean) {
  const { dataUris } = nft;
  let uri = dataUris?.[0];
  const metadataJson: any = useLoadingPreview(nft);

  const thumbnail: any = {
    type: isVideo(uri) ? 'video' : isAudio(uri) ? 'audio' : 'unknown',
  };
  if (!isPreview) {
    thumbnail.uri = uri;
  }

  if (isPreview) {
    if (metadataJson['preview_image_uri']) {
      thumbnail.image = metadataJson['preview_image_uri'];
    }
    if (metadataJson['preview_image_uris']) {
      thumbnail.images = metadataJson['preview_image_uris'];
    }
    if (metadataJson['preview_video_uri']) {
      thumbnail.video = metadataJson['preview_video_uri'];
    }
    if (metadataJson['preview_video_uris']) {
      thumbnail.videos = metadataJson['preview_video_uris'];
    }
    if (metadataJson['error']) {
      thumbnail.error = true;
    }
  }

  const isLoading =
    isPreview &&
    !!nft.metadataUris.length &&
    Object.keys(metadataJson).length === 0;

  return {
    isValid: true,
    isLoading,
    thumbnail,
    error: null,
  };
}

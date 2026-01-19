import FileType from '../constants/FileType';

import getFileExtension from './getFileExtension';
import { isDocument } from './utils';

const IMAGE_EXTENSIONS = new Set(['apng', 'avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'tif', 'tiff', 'webp']);
const VIDEO_EXTENSIONS = new Set(['avi', 'mkv', 'mov', 'mp4', 'm4v', 'mpeg', 'mpg', 'webm', 'wmv']);
const AUDIO_EXTENSIONS = new Set(['aac', 'flac', 'm4a', 'mp3', 'ogg', 'opus', 'wav', 'wma']);
const MODEL_EXTENSIONS = new Set(['gltf', 'glb', 'obj', 'stl']);

export default function getFileType(uri: string): FileType {
  if (!uri) {
    return FileType.UNKNOWN;
  }

  const extension = getFileExtension(uri);
  if (!extension) {
    return FileType.UNKNOWN;
  }

  if (isDocument(extension)) {
    return FileType.DOCUMENT;
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return FileType.IMAGE;
  }

  if (VIDEO_EXTENSIONS.has(extension)) {
    return FileType.VIDEO;
  }

  if (AUDIO_EXTENSIONS.has(extension)) {
    return FileType.AUDIO;
  }

  if (MODEL_EXTENSIONS.has(extension)) {
    return FileType.MODEL;
  }

  return FileType.UNKNOWN;
}

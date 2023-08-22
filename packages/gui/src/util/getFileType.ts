import mime from 'mime-types';

import FileType from '../constants/FileType';

import getFileExtension from './getFileExtension';
import { isDocument } from './utils';

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

  const mimeType = mime.lookup(extension);
  if (!mimeType) {
    return FileType.UNKNOWN;
  }

  if (mimeType.startsWith('image/')) {
    return FileType.IMAGE;
  }

  if (mimeType.startsWith('video/')) {
    return FileType.VIDEO;
  }

  if (mimeType.startsWith('audio/')) {
    return FileType.AUDIO;
  }

  if (mimeType.startsWith('model/')) {
    return FileType.MODEL;
  }

  return FileType.UNKNOWN;
}

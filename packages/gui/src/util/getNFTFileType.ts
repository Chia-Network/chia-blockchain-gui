import { type NFTInfo } from '@chia-network/api';

import FileType from '../@types/FileType';
import getFileType from './getFileType';

export default function getNFTFileType(nft: NFTInfo): FileType {
  const { dataUris } = nft;
  if (dataUris && Array.isArray(dataUris) && dataUris.length > 0) {
    const file = dataUris[0];
    if (file) {
      return getFileType(file);
    }
  }

  return FileType.UNKNOWN;
}

import { type NFTInfo } from '@chia-network/api';

import type FileType from './FileType';
import type Metadata from './Metadata';

type NFTData = {
  nft: NFTInfo;
  type: FileType;
  metadata?: Metadata;
  metadataPromise?: Promise<Metadata>;
};

export default NFTData;

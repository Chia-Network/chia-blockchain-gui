import { type NFTInfo } from '@chia-network/api';

import type FileType from './FileType';
import type Metadata from './Metadata';

type NFTData = {
  nft?: NFTInfo;
  type?: FileType;
  metadata?: Metadata;
  metadataError?: Error;
  metadataPromise?: Promise<Metadata>;
  nftPromise?: Promise<NFTInfo>;
  nftError?: Error;
  coinId?: string;
  isPrivate?: boolean;
};

export default NFTData;

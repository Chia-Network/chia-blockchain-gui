import { type NFTInfo } from '@chia-network/api';

import type FileType from './FileType';
import type Metadata from './Metadata';

type NFTData = {
  id: string; // nftId

  nft?: NFTInfo;
  nftPromise?: Promise<NFTInfo>;
  nftError?: Error;

  metadata?: Metadata;
  metadataError?: Error;
  metadataPromise?: Promise<Metadata>;

  type?: FileType;
  inList?: boolean;
};

export default NFTData;

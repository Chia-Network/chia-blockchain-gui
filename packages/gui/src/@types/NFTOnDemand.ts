import { type NFTInfo } from '@chia-network/api';

type NFTOnDemand = {
  nft?: NFTInfo;
  error?: Error;
  promise?: Promise<NFTInfo>;
};

export default NFTOnDemand;

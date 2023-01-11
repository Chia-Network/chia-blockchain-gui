import LRU from '@chia-network/core';
import { useContext } from 'react';

import { LRUsContext } from '../components/lrus/LRUsProvider';

const NFT_METADATA_LRU_NAME = 'nftMetadata';

export default function useNFTMetadataLRU(): LRU<string, any> {
  const context = useContext(LRUsContext);

  if (!context) {
    throw new Error('useNFTMetadataLRU must be used within a LRUsProvider');
  }

  return context.getLRU(NFT_METADATA_LRU_NAME);
}

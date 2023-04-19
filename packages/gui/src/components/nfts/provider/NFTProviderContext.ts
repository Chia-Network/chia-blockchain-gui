import { type EventEmitter } from 'events';

import { type NFTInfo } from '@chia-network/api';
import { createContext } from 'react';

import type Metadata from '../../../@types/Metadata';
import MetadataOnDemand from '../../../@types/MetadataOnDemand';
import NFTOnDemand from '../../../@types/NFTOnDemand';

const NFTProviderContext = createContext<
  | {
      events: EventEmitter;
      nfts: Map<string, NFTInfo>;
      nachoNFTs: Map<string, NFTInfo>;
      nftsOnDemand: Map<string, NFTOnDemand>;
      metadatasOnDemand: Map<string, MetadataOnDemand>;

      count: number;
      loaded: number;
      progress: number;

      isLoading: boolean;
      error: Error | undefined;

      invalidate: (id?: string) => Promise<void>;
      getNft: (id?: string) => {
        nft: NFTInfo | undefined;
        error: Error | undefined;
        isLoading: boolean;
      };
      getMetadata: (id?: string) => {
        metadata: Metadata | undefined;
        error: Error | undefined;
        isLoading: boolean;
      };
    }
  | undefined
>(undefined);

export default NFTProviderContext;

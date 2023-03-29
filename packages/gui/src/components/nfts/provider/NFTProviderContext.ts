import { type NFTInfo } from '@chia-network/api';
import { createContext } from 'react';

const NFTProviderContext = createContext<
  | {
      nfts: NFTInfo[];
      count: number;
      loaded: number;
      isLoading: boolean;
      error: Error | undefined;
    }
  | undefined
>(undefined);

export default NFTProviderContext;

import { createContext } from 'react';

import type NFTData from '../../../@types/NFTData';

const NFTProviderContext = createContext<
  | {
      nfts: NFTData[];
      count: number;
      loaded: number;
      isLoading: boolean;
      error: Error | undefined;
      progress: number;
      invalidate: (nftId: string) => Promise<void>;
      getByCoinId: (coinId: string) => Promise<NFTData | undefined>;
    }
  | undefined
>(undefined);

export default NFTProviderContext;

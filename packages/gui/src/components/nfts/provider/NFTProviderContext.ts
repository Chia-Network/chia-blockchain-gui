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
    }
  | undefined
>(undefined);

export default NFTProviderContext;

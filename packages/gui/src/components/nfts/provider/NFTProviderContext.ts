import { type NFTInfo } from '@chia-network/api';
import { createContext } from 'react';

import type MetadataState from '../../../@types/MetadataState';
import type NFTPreviewStatus from '../../../@types/NFTPreviewStatus';
import type NFTState from '../../../@types/NFTState';

const NFTProviderContext = createContext<
  | {
      nfts: Map<string, NFTInfo>;
      nachos: Map<string, NFTInfo>;

      count: number;
      loaded: number;
      progress: number;

      isLoading: boolean;
      error: Error | undefined;

      invalidate: (id: string | undefined) => Promise<void>;
      refetch: () => Promise<void>;

      subscribeToChanges: (callback: () => void) => () => void;

      getNFT: (id: string | undefined) => NFTState;
      subscribeToNFTChanges: (id: string | undefined, callback: (nftState: NFTState) => void) => () => void;

      getMetadata: (id: string | undefined) => MetadataState;
      subscribeToMetadataChanges: (
        id: string | undefined,
        callback: (metadataState: MetadataState) => void,
      ) => () => void;

      getPreviewStatus: (id: string | undefined) => NFTPreviewStatus | undefined;
      setPreviewStatus: (id: string, status: NFTPreviewStatus) => void;
      subscribeToPreviewStatusChanges: (callback: () => void) => () => void;
      // How many times the IPFS gateway has come back after being unreachable
      // this session. Consumers that remember fetch failures re-run on a
      // change, the way they do on a gateway change: the failures recorded
      // while the gateway was down are verdicts on the host, not the content.
      ipfsGatewayRecoveries: number;
    }
  | undefined
>(undefined);

export default NFTProviderContext;

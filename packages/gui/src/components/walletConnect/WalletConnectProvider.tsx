import React, { ReactNode, createContext } from 'react';

import type Pair from '../../@types/Pair';
import useNotifications from '../../hooks/useNotifications';
import useWalletConnect from '../../hooks/useWalletConnect';

export const WalletConnectChiaProjectId = 'f3f661fcfc24e2e6e6c6f926f02c9c6e';

export const WalletConnectContext = createContext<
  | {
      enabled: boolean;
      isLoading: boolean;
      error: Error | undefined;
      pair: (uri: string, fingerprints: number[], mainnet?: boolean) => Promise<string>;
      disconnect: (topic: string) => Promise<void>;
      pairs: {
        getPair: (topic: string) => Pair | undefined;
        get: () => Pair[];
      };
    }
  | undefined
>(undefined);

export type WalletConnectProviderProps = {
  children: ReactNode;
  projectId: string;
};

export default function WalletConnectProvider(props: WalletConnectProviderProps) {
  const { children, projectId } = props;

  const { showNotification } = useNotifications();

  const walletConnect = useWalletConnect({
    projectId,
    onNotification: showNotification,
  });

  return <WalletConnectContext.Provider value={walletConnect}>{children}</WalletConnectContext.Provider>;
}

import React, { ReactNode, createContext } from 'react';
import useWalletConnect from '../../hooks/useWalletConnect';
import type Pair from '../../@types/Pair';

export const WalletConnectContext = createContext<
  | {
      enabled: boolean;
      isLoading: boolean;
      error: Error | undefined;
      pair: (
        uri: string,
        fingerprints: number[],
        mainnet?: boolean,
      ) => Promise<void>;
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

export default function WalletConnectProvider(
  props: WalletConnectProviderProps,
) {
  const { children, projectId } = props;

  const walletConnect = useWalletConnect({
    projectId,
  });

  return (
    <WalletConnectContext.Provider value={walletConnect}>
      {children}
    </WalletConnectContext.Provider>
  );
}

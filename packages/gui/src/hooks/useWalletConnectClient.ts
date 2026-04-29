import Client from '@walletconnect/sign-client';
import { useState, useEffect, useCallback, useMemo } from 'react';

import useWalletConnectPreferences from './useWalletConnectPreferences';

function clearWalletConnectStorage(): void {
  if (typeof indexedDB === 'undefined') return;
  try {
    indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB');
  } catch {
    /* best-effort */
  }
}

const defaultMetadata = {
  name: 'Chia Blockchain',
  description: 'GUI for Chia Blockchain',
  url: 'https://www.chia.net',
  icons: ['https://www.chia.net/wp-content/uploads/2022/09/chia-logo.svg'],
};

export type UseWalletConnectConfig = {
  projectId: string;
  relayUrl?: string;
  metadata?: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  debug?: boolean;
};

let clientId = 1;

type WalletConnectSingleton = {
  client?: Client;
  initPromise?: Promise<Client>;
  configKey?: string;
};

const singleton: WalletConnectSingleton = {};

export default function useWalletConnectClient(config: UseWalletConnectConfig) {
  const { projectId, relayUrl = 'wss://relay.walletconnect.com', metadata = defaultMetadata, debug = false } = config;

  const { enabled } = useWalletConnectPreferences();

  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState<Client | undefined>();
  const [error, setError] = useState<Error | undefined>();

  const metadataString = JSON.stringify(metadata);
  const memoizedMetadata = useMemo(() => JSON.parse(metadataString), [metadataString]);

  const prepareClient = useCallback(async () => {
    const currentClientId = ++clientId;

    try {
      setClient(undefined);
      setError(undefined);
      setIsLoading(true);

      if (!enabled) {
        return;
      }

      const configKey = JSON.stringify({ projectId, relayUrl, metadata: memoizedMetadata, debug });

      if (singleton.configKey !== undefined && singleton.configKey !== configKey) {
        singleton.client = undefined;
        singleton.initPromise = undefined;
      }

      if (!singleton.initPromise) {
        singleton.configKey = configKey;
        singleton.initPromise = Client.init({
          logger: debug ? 'debug' : 'error',
          projectId,
          relayUrl,
          metadata: memoizedMetadata,
        })
          .then((createdClient) => {
            singleton.client = createdClient;
            return createdClient;
          })
          .catch((initError) => {
            console.error('[WC] Client.init() failed, clearing storage', initError);
            clearWalletConnectStorage();
            singleton.initPromise = undefined;
            singleton.configKey = undefined;
            throw initError;
          });
      }

      const newClient = await singleton.initPromise;
      if (currentClientId === clientId) {
        setClient(newClient);
      }
    } catch (e) {
      if (currentClientId === clientId) {
        setError(e as Error);
      }
    } finally {
      if (currentClientId === clientId) {
        setIsLoading(false);
      }
    }
  }, [projectId, relayUrl, memoizedMetadata, debug, enabled]);

  useEffect(() => {
    prepareClient();
  }, [prepareClient]);

  return {
    isLoading,
    client,
    error,
  };
}

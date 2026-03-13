import { useEffect, useCallback, useRef } from 'react';

import type Notification from '../@types/Notification';
import { disconnectPair, bindEvents, cleanupPairings } from '../util/walletConnect';

import useWalletConnectClient from './useWalletConnectClient';
import useWalletConnectCommand from './useWalletConnectCommand';
import useWalletConnectPairs from './useWalletConnectPairs';
import useWalletConnectPreferences from './useWalletConnectPreferences';

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
  onNotification?: (notification: Notification) => void;
};

export default function useWalletConnect(config: UseWalletConnectConfig) {
  const { projectId, relayUrl, metadata, debug, onNotification } = config;

  const pairs = useWalletConnectPairs();
  const { client, isLoading, error } = useWalletConnectClient({
    projectId,
    relayUrl,
    metadata,
    debug,
  });

  const { process, isLoading: isLoadingWalletConnectCommand } = useWalletConnectCommand({
    onNotification,
  });
  const { enabled } = useWalletConnectPreferences();

  const processRef = useRef(process);
  processRef.current = process;

  const pairsRef = useRef(pairs);
  pairsRef.current = pairs;

  const isLoadingData = isLoading || isLoadingWalletConnectCommand;

  useEffect(() => {
    if (!client) {
      return undefined;
    }

    const currentPairs = pairsRef.current;
    cleanupPairings(client, currentPairs);

    return bindEvents(client, currentPairs, () => processRef.current);
  }, [client]);

  const handlePair = useCallback(
    async (uri: string, fingerprints: number[], mainnet = false) => {
      if (!client) {
        throw new Error('Client is not defined');
      }

      const { topic } = await client.core.pairing.pair({ uri });
      if (!topic) {
        throw new Error('Pairing failed');
      }

      pairsRef.current.addPair({
        topic,
        fingerprints,
        mainnet,
        sessions: [],
      });

      return topic;
    },
    [client],
  );

  const handleDisconnect = useCallback(
    (topic: string) => {
      if (!client) {
        throw new Error('Client is not defined');
      }

      return disconnectPair(client, pairsRef.current, topic);
    },
    [client],
  );

  return {
    enabled,
    isLoading: isLoadingData,
    error,

    pair: handlePair,
    disconnect: handleDisconnect,

    pairs,
  };
}

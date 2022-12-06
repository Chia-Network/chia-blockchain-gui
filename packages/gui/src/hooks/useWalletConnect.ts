import { useEffect, useCallback, useRef } from 'react';

import {
  processSessionProposal,
  processSessionDelete,
  processSessionRequest,
  processPairingDelete,
  disconnectPair,
} from '../util/walletConnect';
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
};

export default function useWalletConnect(config: UseWalletConnectConfig) {
  const { projectId, relayUrl, metadata, debug } = config;

  const pairs = useWalletConnectPairs();
  const { client, isLoading, error } = useWalletConnectClient({
    projectId,
    relayUrl,
    metadata,
    debug,
  });

  const { process, isLoading: isLoadingWalletConnectCommand } = useWalletConnectCommand();
  const { enabled } = useWalletConnectPreferences();

  const processRef = useRef(process);
  processRef.current = process;

  const isLoadingData = isLoading || isLoadingWalletConnectCommand;

  useEffect(() => {
    if (!client) {
      return undefined;
    }

    function handleSessionProposal(event: any) {
      if (client) {
        processSessionProposal(client, pairs, event);
      }
    }

    function handleSessionDelete(event: any) {
      processSessionDelete(pairs, event);
    }

    function handleSessionRequest(event: any) {
      if (client) {
        processSessionRequest(client, pairs, processRef.current, event);
      }
    }

    function handlePairingDelete(event: any) {
      processPairingDelete(pairs, event);
    }

    client.on('session_proposal', handleSessionProposal);
    client.on('session_delete', handleSessionDelete);
    client.on('session_request', handleSessionRequest);

    client.core.pairing.events.on('pairing_delete', handlePairingDelete);

    return () => {
      client.off('session_proposal', handleSessionProposal);
      client.off('session_delete', handleSessionDelete);
      client.off('session_request', handleSessionRequest);

      client.core.pairing.events.off('pairing_delete', handlePairingDelete);
    };
  }, [client, pairs]);

  const handlePair = useCallback(
    async (uri: string, fingerprints: number[], mainnet = false) => {
      if (!client) {
        throw new Error('Client is not defined');
      }

      const { topic } = await client.core.pairing.pair({ uri });
      if (!topic) {
        throw new Error('Pairing failed');
      }

      pairs.addPair({
        topic,
        fingerprints,
        mainnet,
        sessions: [],
      });

      return topic;
    },
    [client, pairs]
  );

  const handleDisconnect = useCallback(
    (topic: string) => {
      if (!client) {
        throw new Error('Client is not defined');
      }

      return disconnectPair(client, pairs, topic);
    },
    [client, pairs]
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

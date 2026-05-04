import { useEffect, useCallback, useRef } from 'react';

import { approveSessionProposal, bindEvents, disconnectPair, rejectSessionProposal } from '../util/walletConnect';

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

  const pairsRef = useRef(pairs);
  pairsRef.current = pairs;

  const isLoadingData = isLoading || isLoadingWalletConnectCommand;

  useEffect(() => {
    if (!client) {
      return undefined;
    }

    return bindEvents(client, pairsRef.current, () => processRef.current);
  }, [client]);

  const handlePair = useCallback(
    async (uri: string) => {
      if (!client) {
        throw new Error('Client is not defined');
      }

      const { topic } = await client.core.pairing.pair({ uri });
      if (!topic) {
        throw new Error('Pairing failed');
      }

      // Mainnet vs testnet is captured by main when `registerPair` runs and
      // persisted on the YAML PairRecord — it's not stored on the renderer
      // side anymore. The renderer's pair record is purely transient WC SDK
      // state (sessions, pendingProposal).
      pairsRef.current.addPair({
        topic,
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

  const handleApproveSession = useCallback(
    (topic: string, fingerprints: number[], mainnet: boolean, methods?: string[]) => {
      if (!client) {
        throw new Error('Client is not defined');
      }

      return approveSessionProposal(client, pairsRef.current, topic, fingerprints, mainnet, methods);
    },
    [client],
  );

  const handleRejectSession = useCallback(
    (topic: string) => {
      if (!client) {
        throw new Error('Client is not defined');
      }

      return rejectSessionProposal(client, pairsRef.current, topic);
    },
    [client],
  );

  return {
    enabled,
    isLoading: isLoadingData,
    error,

    pair: handlePair,
    disconnect: handleDisconnect,
    approveSession: handleApproveSession,
    rejectSession: handleRejectSession,

    pairs,
  };
}

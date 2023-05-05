import { EventEmitter } from 'events';

import { useEffect, useCallback, useRef } from 'react';

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
};

export function waitForSessionProposal(topic: string, eventEmitter: EventEmitter) {
  const eventName = `wallet-connect-session-created:${topic}`;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      eventEmitter.off(eventName, handleSessionProposalCreated);
      reject(new Error('Session proposal timeout'));
    }, 30_000);

    const handleSessionProposalCreated = (event: any) => {
      console.log('handleSessionProposalCreated');
      clearTimeout(timeout);
      eventEmitter.off(eventName, handleSessionProposalCreated);
      resolve(event);
    };

    console.log(`waiting for event: ${eventName}`);
    eventEmitter.on(eventName, handleSessionProposalCreated);
  });
}

export default function useWalletConnect(config: UseWalletConnectConfig) {
  const { projectId, relayUrl, metadata, debug } = config;
  const eventEmitterRef = useRef(new EventEmitter());
  console.log('eventEmitterRef.current:');
  console.log(eventEmitterRef.current);

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

    cleanupPairings(client, pairs);

    console.log('calling bindEvents from useWalletConnect.ts');
    return bindEvents(client, pairs, () => processRef.current, eventEmitterRef.current);
  }, [client, pairs, eventEmitterRef]);

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

      console.log('waiting for session proposal');
      await waitForSessionProposal(topic, eventEmitterRef.current);

      console.log('handlePair returning topic', topic);
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

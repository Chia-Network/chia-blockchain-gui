import { useState, useEffect, useCallback, useRef } from 'react';
import Client from '@walletconnect/sign-client';
import useWalletConnectCommand from './useWalletConnectCommand';
import useWalletConnectPairs from './useWalletConnectPairs';
import useWalletConnectPrefs from './useWalletConnectPrefs';
import walletConnectCommands from '../constants/WalletConnectCommands';

const availableCommands = walletConnectCommands.map(
  (command) => `chia_${command.command}`,
);

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

export default function useWalletConnect(config: UseWalletConnectConfig) {
  const {
    projectId,
    relayUrl,
    metadata = defaultMetadata,
    debug = false,
  } = config;

  const { enabled } = useWalletConnectPrefs();
  const [isLoading, setIsLoading] = useState(true);
  const [_client, setClient] = useState<Client>();
  const _pairs = useWalletConnectPairs();
  const [error, setError] = useState<Error>();
  const { process, isLoading: isLoadingWalletConnectCommand } =
    useWalletConnectCommand();

  const state = useRef<{
    client?: Client;
    pairs: typeof _pairs;
  }>({
    client: _client,
    pairs: _pairs,
  });

  state.current = {
    client: _client,
    pairs: _pairs,
  };

  const isLoadingData = isLoading || isLoadingWalletConnectCommand;

  async function disconnectPair(client: Client, topic: string) {
    const { pairs } = state.current;

    await client.core.pairing.disconnect({ topic });
    pairs.removePair(topic);
  }

  const handleSessionProposal = useCallback(async (event) => {
    const { client, pairs } = state.current;
    if (!client) {
      throw new Error('Client not initialized');
    }

    const {
      id,
      params: {
        pairingTopic,
        proposer: { metadata },
        requiredNamespaces,
      },
    } = event;

    if (!pairingTopic) {
      throw new Error('Pairing topic not found');
    }

    const requiredNamespace = requiredNamespaces.chia;
    if (!requiredNamespace) {
      throw new Error('Missing required chia namespace');
    }

    const { chains } = requiredNamespace;
    const chain = chains.find((chain: string) =>
      ['chia:testnet', 'chia:mainnet'].includes(chain),
    );
    if (!chain) {
      throw new Error('Chain not supported');
    }

    pairs.updatePair(pairingTopic, { metadata });

    const pair = pairs.getPair(pairingTopic);
    if (!pair) {
      throw new Error('Pair not found');
    }

    const { fingerprints, mainnet } = pair;
    const instance = mainnet ? 'mainnet' : 'testnet';
    const accounts = fingerprints.map(
      (fingerprint) => `chia:${instance}:${fingerprint}`,
    );

    const namespaces = {
      chia: {
        accounts,
        methods: availableCommands,
        events: [],
      },
    };

    // const methods =
    const { acknowledged } = await client.approve({
      id,
      namespaces,
    });

    const result = await acknowledged();
    if (!result?.acknowledged) {
      return;
    }

    // new session created
    pairs.updatePair(pairingTopic, (pair) => ({
      ...pair,
      sessions: [
        ...pair.sessions,
        {
          topic: result.topic,
          metadata: metadata,
          namespaces,
        },
      ],
    }));
  }, []);

  const handleSessionDelete = useCallback((event) => {
    const { topic: session } = event;
    const { pairs } = state.current;

    if (session) {
      pairs.removeSessionFromPair(session);
    }
  }, []);

  const handlePairingDelete = useCallback((event) => {
    const { topic } = event;
    const { pairs } = state.current;

    pairs.removePair(topic);
  }, []);

  const handleSessionRequest = useCallback(
    async (event: {
      id: number;
      topic: string;
      params: {
        request: { method: string; params: any };
        chainId: string;
      };
    }) => {
      const {
        id,
        topic,
        params: {
          request: { method, params },
          chainId,
        },
      } = event;

      const { client, pairs } = state.current;

      try {
        if (!client) {
          throw new Error('Client not initialized');
        }

        const pair = pairs.getPairBySession(topic);
        if (!pair) {
          throw new Error('Pair not found');
        }

        const [network, instance] = chainId.split(':');
        if (network !== 'chia') {
          throw new Error('Network not supported');
        }

        const isMainnet = instance === 'mainnet';
        if (isMainnet !== pair.mainnet) {
          throw new Error('Network instance is different');
        }

        const { fingerprint, ...rest } = params;
        const updatedParams = {
          ...rest,
          fingerprint: Number.parseInt(fingerprint),
        };

        if (!pair.fingerprints.includes(updatedParams.fingerprint)) {
          throw new Error('Fingerprint not found');
        }

        const result = await process(topic, method, updatedParams);

        await client.respond({
          topic,
          response: {
            id,
            jsonrpc: '2.0',
            result,
          },
        });
      } catch (error) {
        await client?.respond({
          topic,
          response: {
            id,
            jsonrpc: '2.0',
            error: {
              code: -32600,
              message: (error as Error).message ?? 'Invalid Request',
            },
          },
        });
      }
    },
    [process],
  );

  function disconnectClient(client: Client) {
    if (!client) {
      return;
    }

    //client.off('session_proposal', handleSessionProposal);
    //client.off('session_delete', handleSessionDelete);
    // client.off('session_request', handleSessionRequest);

    //client.pairing.off('pairing_delete', handlePairingDelete);

    setClient(undefined);
  }

  const subscribeToEvents = useCallback(
    async (client: Client) => {
      if (!client) {
        throw new Error('Client is not defined');
      }

      client.on('session_proposal', handleSessionProposal);
      client.on('session_delete', handleSessionDelete);
      client.on('session_request', handleSessionRequest);

      // client.pairing.on('pairing_delete', handlePairingDelete);

      /*
      client.on('session_event', (args) => {
        console.log('session_event', args);
      });
      */
    },
    [handleSessionProposal, handleSessionDelete, handleSessionRequest],
  );

  async function updatePairings(client: Client) {
    const { pairs } = state.current;
    const pairings = await client.core.pairing.getPairings();

    for await (const pairing of pairings) {
      const { topic, active } = pairing;

      // disconnect peers which are not used in application
      if (!pairs.hasPair(topic)) {
        await disconnectPair(client, topic);
      }

      // reactivate pairing if it was active before
      if (!active) {
        await client.core.pairing.activate({ topic });
      }
    }

    // remove pairs which are not in pairing list
    for await (const pair of pairs.get()) {
      const { topic } = pair;
      const hasPairing = pairings.find((pairing) => pairing.topic === topic);

      if (!hasPairing) {
        disconnectPair(client, topic);
      }
    }
  }

  async function prepareClient() {
    setIsLoading(true);
    setError(undefined);

    const { client } = state.current;
    if (client) {
      disconnectClient(client);
    }

    try {
      if (!enabled) {
        return;
      }

      const newClient = await Client.init({
        logger: debug ? 'debug' : undefined,
        projectId,
        relayUrl: 'wss://relay.walletconnect.com',
        metadata,
      });

      setClient(newClient);

      subscribeToEvents(newClient);
      await updatePairings(newClient);
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    prepareClient();

    return () => {
      const { client } = state.current;
      if (client) {
        disconnectClient(client);
      }
    };
  }, [projectId, relayUrl, JSON.stringify(metadata), enabled]);

  async function handlePair(
    uri: string,
    fingerprints: number[],
    mainnet = false,
  ) {
    const { client, pairs } = state.current;
    if (!client) {
      throw new Error('Client is not defined');
    }

    const { topic, ...rest } = await client.core.pairing.pair({ uri });
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
  }

  async function handleDisconnect(topic: string) {
    const { client } = state.current;
    if (!client) {
      throw new Error('Client is not defined');
    }

    await disconnectPair(client, topic);
  }

  return {
    enabled,
    isLoading: isLoadingData,
    error,

    pair: handlePair,
    disconnect: handleDisconnect,

    pairs: _pairs,
  };
}

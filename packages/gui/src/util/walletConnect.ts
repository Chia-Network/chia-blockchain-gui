import Client from '@walletconnect/sign-client';
import initDebug from 'debug';

import walletConnectCommands from '../constants/WalletConnectCommands';
import { type Pairs } from '../hooks/useWalletConnectPairs';

const log = initDebug('chia-gui:walletConnect');

const availableCommands = walletConnectCommands.map((command) => `chia_${command.command}`);

/*
export const STANDARD_ERROR_MAP = {
  [PARSE_ERROR]: { code: -32700, message: "Parse error" },
  [INVALID_REQUEST]: { code: -32600, message: "Invalid Request" },
  [METHOD_NOT_FOUND]: { code: -32601, message: "Method not found" },
  [INVALID_PARAMS]: { code: -32602, message: "Invalid params" },
  [INTERNAL_ERROR]: { code: -32603, message: "Internal error" },
  [SERVER_ERROR]: { code: -32000, message: "Server error" },
};
*/

export function processError(error: Error) {
  if (error.message.includes('No matching key')) {
    log('Pairing not found');
    return;
  }

  throw error;
}

export async function processSessionProposal(
  client: Client,
  pairs: Pairs,
  event: {
    id: number;
    params: {
      pairingTopic: string;
      proposer: {
        metadata?: {
          name?: string;
          description?: string;
          url?: string;
          icons?: string[];
        };
      };
      requiredNamespaces: {
        chia: {
          chains: string[];
          methods: string[];
        };
      };
    };
  }
) {
  try {
    if (!client) {
      throw new Error('Client not initialized');
    }

    const {
      id,
      params: {
        pairingTopic,
        proposer: { metadata: proposerMetadata },
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

    const { chains, methods } = requiredNamespace;
    const chain = chains.find((item) => ['chia:testnet', 'chia:mainnet'].includes(item));
    if (!chain) {
      throw new Error('Chain not supported');
    }

    // find unsupported methods
    const method = methods.find((item) => !availableCommands.includes(item));
    if (method) {
      log('dApp wants to use unsupported command', method);
      // throw new Error(`Method not supported: ${method}`);
    }

    if (proposerMetadata) {
      pairs.updatePair(pairingTopic, { metadata: proposerMetadata });
    }

    const pair = pairs.getPair(pairingTopic);
    if (!pair) {
      throw new Error('Pair not found');
    }

    const { fingerprints, mainnet } = pair;
    const instance = mainnet ? 'mainnet' : 'testnet';
    const accounts = fingerprints.map((fingerprint) => `chia:${instance}:${fingerprint}`);

    const namespaces = {
      chia: {
        accounts,
        methods,
        events: [],
      },
    };

    const { acknowledged } = await client.approve({
      id,
      namespaces,
    });

    const result = await acknowledged();
    if (!result?.acknowledged) {
      return;
    }

    // new session created
    pairs.updatePair(pairingTopic, (p) => ({
      ...p,
      sessions: [
        ...p.sessions,
        {
          topic: result.topic,
          metadata: proposerMetadata,
          namespaces,
        },
      ],
    }));
  } catch (error) {
    try {
      log('Session proposal error', error);

      const {
        id,
        params: { pairingTopic },
      } = event;

      await client?.respond({
        topic: pairingTopic,
        response: {
          id,
          jsonrpc: '2.0',
          error: {
            code: -32_600,
            message: (error as Error).message ?? 'Invalid Session Proposal',
          },
        },
      });
    } catch (e) {
      processError(e as Error);
    }
  }
}

export async function processSessionDelete(client: Client, pairs: Pairs, event: { id: number; topic: string }) {
  try {
    const { topic: session } = event;

    if (session) {
      pairs.removeSessionFromPair(session);
    }
  } catch (error) {
    // session was deleted we are not sending any response
    log('Session delete error', error);
    processError(e as Error);
  }
}

export function processPairingDelete(pairs: Pairs, event: { topic: string }) {
  const { topic } = event;

  pairs.removePair(topic);
}

export async function processSessionRequest(
  client: Client | undefined,
  pairs: Pairs,
  process: (topic: string, command: string, params: any) => Promise<any>,
  event: {
    id: number;
    topic: string;
    params: {
      request: { method: string; params: any };
      chainId: string;
    };
  }
) {
  try {
    const {
      id,
      topic,
      params: {
        request: { method, params },
        chainId,
      },
    } = event;

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
      fingerprint: Number.parseInt(fingerprint, 10),
    };

    if (!pair.fingerprints.includes(updatedParams.fingerprint)) {
      throw new Error('Fingerprint not found');
    }

    log('method', method, updatedParams);
    const result = await process(topic, method, updatedParams);
    log('result', result);

    await client.respond({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        result,
      },
    });
  } catch (error) {
    try {
      log('Session request error', error);

      const { id, topic } = event;
      await client?.respond({
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          error: {
            code: -32_600,
            message: (error as Error).message ?? 'Invalid Session Request',
          },
        },
      });
    } catch (e) {
      processError(e as Error);
    }
  }
}

export async function disconnectPair(client: Client, pairs: Pairs, topic: string) {
  try {
    const pairings = await client.core.pairing.getPairings();
    const pairing = pairings.find((p) => p.topic === topic);
    if (pairing) {
      await client.core.pairing.disconnect({ topic });
    }

    pairs.removePair(topic);
  } catch (e) {
    processError(e as Error);
  }
}

export async function cleanupPairings(client: Client, pairs: Pairs) {
  try {
    const pairings = await client.core.pairing.getPairings();

    // disconnect pairings which are not registered in application or reactivate them
    await Promise.all(
      pairings.map(async (pairing) => {
        const { topic, active } = pairing;

        // disconnect peers which are not used in application
        if (!pairs.hasPair(topic)) {
          log('Disconnecting pairing because WalletConnect pair is not registered in the application', topic);
          await disconnectPair(client, pairs, topic);
          return;
        }

        // reactivate pairing if it was active before
        if (!active) {
          try {
            log('Reactivating pairing', topic);
            await client.core.pairing.activate({ topic });
          } catch (error) {
            processError(error as Error);
          }
        }
      })
    );

    // remove pairs which are not in pairing list
    await Promise.all(
      pairs.get().map(async (pair) => {
        const { topic } = pair;
        const hasPairing = pairings.find((pairing) => pairing.topic === topic);

        if (!hasPairing) {
          log('Disconnecting pairing because WalletConnect pair is not registered in the pairing list', topic);
          await disconnectPair(client, pairs, topic);
        }
      })
    );
  } catch (e) {
    log('Cleanup pairings error', e);
  }
}

export function bindEvents(
  client: Client,
  pairs: Pairs,
  onProcess: () => (topic: string, command: string, params: any) => Promise<any>
) {
  if (!client) {
    throw new Error('Client not initialized');
  }

  async function handleSessionProposal(event: any) {
    await processSessionProposal(client, pairs, event);
  }

  async function handleSessionDelete(event: any) {
    await processSessionDelete(client, pairs, event);
  }

  async function handleSessionRequest(event: any) {
    await processSessionRequest(client, pairs, onProcess(), event);
  }

  async function handlePairingDelete(event: any) {
    try {
      await processPairingDelete(pairs, event);
    } catch (e) {
      log('Pairing delete error', e);
    }
  }

  function cleanUpBindings() {
    try {
      client.off('session_proposal', handleSessionProposal);
      client.off('session_delete', handleSessionDelete);
      client.off('session_request', handleSessionRequest);

      client.core.pairing.events.off('pairing_delete', handlePairingDelete);
    } catch (e) {
      log('Clean up bindings error', e);
    }
  }

  try {
    client.on('session_proposal', handleSessionProposal);
    client.on('session_delete', handleSessionDelete);
    client.on('session_request', handleSessionRequest);

    client.core.pairing.events.on('pairing_delete', handlePairingDelete);

    return cleanUpBindings;
  } catch (e) {
    log('Bind events error', e);
    return cleanUpBindings;
  }
}

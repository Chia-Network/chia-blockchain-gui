import Client from '@walletconnect/sign-client';
import { getSdkError } from '@walletconnect/utils';
import initDebug from 'debug';

import { WcError, WcErrorCode, decodeWcErrorFromIpc } from '../@types/WcError';
import { type Pairs } from '../hooks/useWalletConnectPairs';

const log = initDebug('chia-gui:walletConnect');

async function respondSessionRequestError(client: Client, topic: string, id: number, message: string, code: number) {
  try {
    await client.respond({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        error: { code, message },
      },
    });
  } catch (e) {
    // Dapp/SDK may have evicted the request (5-min expiry, disconnect race,
    // etc.). Swallow so the `session_request` listener doesn't surface an
    // uncaught rejection as a user-facing popup.
    log('Failed to respond to session request', { topic, id }, e);
  }
}

// IPC strips the WcError prototype; main encodes the code via prefix and we
// recover it here. Plain Errors (daemon failures, unexpected throws) default
// to INTERNAL_ERROR — the spec-correct fallback for "wallet failed".
function toWcError(error: unknown): WcError {
  if (error instanceof WcError) return error;
  if (error instanceof Error) {
    const decoded = decodeWcErrorFromIpc(error.message);
    if (decoded) return decoded;
    return new WcError(error.message, WcErrorCode.INTERNAL_ERROR);
  }
  return new WcError(String(error), WcErrorCode.INTERNAL_ERROR);
}

export function processError(error: Error) {
  if (error.message.includes('No matching key')) {
    console.info('[chia-gui:walletConnect] Pairing not found (stale key, safe to ignore):', error.message);
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
      requiredNamespaces?: {
        chia?: {
          chains: string[];
          methods: string[];
          events?: string[];
        };
      };
      optionalNamespaces?: {
        chia?: {
          chains: string[];
          methods: string[];
          events?: string[];
        };
      };
    };
  },
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
        optionalNamespaces,
      },
    } = event;

    if (!pairingTopic) {
      throw new Error('Pairing topic not found');
    }

    // SDK v2.17+ moved requiredNamespaces to optionalNamespaces; merge both.
    const requiredChia = requiredNamespaces?.chia;
    const optionalChia = optionalNamespaces?.chia;

    if (!requiredChia && !optionalChia) {
      throw new Error('Missing required chia namespace');
    }

    const chains = [...new Set([...(requiredChia?.chains ?? []), ...(optionalChia?.chains ?? [])])];
    const methods = [...new Set([...(requiredChia?.methods ?? []), ...(optionalChia?.methods ?? [])])];
    const events = [...new Set([...(requiredChia?.events ?? []), ...(optionalChia?.events ?? [])])];
    const supportedChains = chains.filter((item) => ['chia:testnet', 'chia:mainnet'].includes(item));
    if (!supportedChains.length) {
      throw new Error('Chain not supported');
    }

    const pair = pairs.getPair(pairingTopic);
    if (!pair) {
      throw new Error('Pair not found');
    }

    // Capture the proposal but defer approval — the main-process Pair dialog
    // owns wallet selection and permission grant; `approveSessionProposal`
    // runs after the user confirms.
    pairs.updatePair(pairingTopic, (p) => ({
      ...p,
      metadata: proposerMetadata ?? p.metadata,
      pendingProposal: {
        id,
        proposerMetadata,
        methods,
        events,
        chains: supportedChains,
      },
    }));
  } catch (error) {
    try {
      log('Session proposal error', error);
      console.error('WC session proposal REJECTED due to error:', error);

      const { id } = event;

      await client?.reject({
        id,
        reason: getSdkError('USER_REJECTED'),
      });
    } catch (e) {
      processError(e as Error);
    }
  }
}

export async function approveSessionProposal(
  client: Client,
  pairs: Pairs,
  pairTopic: string,
  fingerprints: number[],
  mainnet: boolean,
  /** Must be the registry-filtered subset persisted on the pair record. */
  approvedMethods: string[],
) {
  if (!client) {
    throw new Error('Client not initialized');
  }

  const pair = pairs.getPair(pairTopic);
  if (!pair) {
    throw new Error('Pair not found');
  }

  const proposal = pair.pendingProposal;
  if (!proposal) {
    throw new Error('No pending proposal for this pair');
  }

  if (!fingerprints.length) {
    throw new Error('At least one wallet must be selected');
  }

  const instance = mainnet ? 'mainnet' : 'testnet';
  const chain = `chia:${instance}`;
  if (!proposal.chains.includes(chain)) {
    throw new Error(`Requested chains do not include pair network: ${chain}`);
  }

  const accounts = fingerprints.map((fingerprint) => `${chain}:${fingerprint}`);
  const namespaces = {
    chia: {
      accounts,
      methods: approvedMethods,
      events: proposal.events,
    },
  };

  const { acknowledged } = await client.approve({
    id: proposal.id,
    namespaces,
  });

  const result = await acknowledged();
  if (!('topic' in result) || !result.topic) {
    return;
  }

  pairs.updatePair(pairTopic, (p) => ({
    ...p,
    fingerprints,
    pendingProposal: undefined,
    sessions: [
      ...p.sessions,
      {
        topic: result.topic,
        metadata: proposal.proposerMetadata,
        namespaces,
      },
    ],
  }));
}

export async function rejectSessionProposal(client: Client, pairs: Pairs, pairTopic: string) {
  if (!client) {
    throw new Error('Client not initialized');
  }

  const pair = pairs.getPair(pairTopic);
  const proposal = pair?.pendingProposal;
  if (proposal) {
    try {
      await client.reject({
        id: proposal.id,
        reason: getSdkError('USER_REJECTED'),
      });
    } catch (e) {
      log('Failed to reject session proposal', e);
    }
  }

  await disconnectPair(client, pairs, pairTopic);
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
    processError(error as Error);
  }
}

export async function processPairingDelete(pairs: Pairs, event: { topic: string }) {
  const { topic } = event;

  pairs.removePair(topic);
  await revokeMainPair(topic);
}

// Best-effort. A stale main record is inert (no session = no dispatch), so
// failure here doesn't block teardown — log and move on.
async function revokeMainPair(topic: string): Promise<void> {
  try {
    await window.permissionsAPI.revokePair(topic);
  } catch (e) {
    log('Failed to revoke main-side pair record', topic, e);
  }
}

export async function processSessionRequest(
  client: Client | undefined,
  pairs: Pairs,
  process: (topic: string, command: string, params: any, ctx: { mainnet: boolean }) => Promise<any>,
  event: {
    id: number;
    topic: string;
    params: {
      request: { method: string; params: any };
      chainId: string;
    };
  },
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
      const allPairs = pairs.get();
      const allSessions = allPairs.flatMap((p) => p.sessions?.map((s) => s.topic) ?? []);
      console.warn(
        `[WC] Pair not found for session=${topic} method=${method} id=${id}`,
        `| knownPairs=${allPairs.length} pairTopics=[${allPairs.map((p) => p.topic.slice(0, 8)).join(',')}]`,
        `| knownSessions=${allSessions.length} sessionTopics=[${allSessions.map((s) => s.slice(0, 8)).join(',')}]`,
        '— disconnecting orphan session',
      );
      try {
        await respondSessionRequestError(client, topic, id, 'Pair not found', WcErrorCode.USER_REJECTED);
      } catch (e) {
        log('Failed to respond to orphan session request:', e);
      }

      try {
        await client.disconnect({ topic, reason: getSdkError('USER_DISCONNECTED') });
      } catch (e) {
        log('Failed to disconnect orphan session:', e);
      }
      return;
    }

    const [network, instance] = chainId.split(':');
    if (network !== 'chia') {
      throw new WcError('Network not supported', WcErrorCode.UNSUPPORTED_CHAINS);
    }
    const isMainnet = instance === 'mainnet';

    // All gates (network/fingerprint/commands) live in main; renderer is
    // not trusted for any of them.

    const { fingerprint, ...rest } = params;
    const updatedParams = {
      ...rest,
      fingerprint: Number.parseInt(fingerprint, 10),
    };

    log('method', method, updatedParams);
    // Main keys PairRecord by pair topic, not session topic — translate here.
    const result = await process(pair.topic, method, updatedParams, { mainnet: isMainnet });
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
      if (client) {
        const wc = toWcError(error);
        await respondSessionRequestError(client, topic, id, wc.message, wc.code);
      }
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
      const sessions = pairs.getPair(topic)?.sessions ?? [];
      await Promise.all(
        sessions.map(async (session) => {
          try {
            await client.disconnect({ topic: session.topic, reason: getSdkError('USER_DISCONNECTED') });
          } catch (e) {
            log(`Failed to disconnect session ${session.topic}:`, e);
          }
        }),
      );

      try {
        await client.core.pairing.disconnect({ topic });
      } catch (e) {
        log(`Failed to disconnect pairing ${topic}:`, e);
      }
    }
  } catch (e) {
    log('Error during pair disconnect, removing pair anyway:', e);
  } finally {
    pairs.removePair(topic);
    // Drop the main-side record so disconnected pairs don't leave dormant consents.
    await revokeMainPair(topic);
  }
}

export async function cleanupPairings(client: Client, pairs: Pairs) {
  try {
    const pairings = await client.core.pairing.getPairings();

    await Promise.all(
      pairings.map(async (pairing) => {
        const { topic, active } = pairing;

        if (!pairs.hasPair(topic)) {
          log('Disconnecting pairing because WalletConnect pair is not registered in the application', topic);
          await disconnectPair(client, pairs, topic);
          return;
        }

        if (!active) {
          try {
            log('Reactivating pairing', topic);
            await client.core.pairing.activate({ topic });
          } catch (error) {
            processError(error as Error);
          }
        }
      }),
    );

    await Promise.all(
      pairs.get().map(async (pair) => {
        const { topic } = pair;
        const hasPairing = pairings.find((pairing) => pairing.topic === topic);

        if (!hasPairing) {
          log('Disconnecting pairing because WalletConnect pair is not registered in the pairing list', topic);
          await disconnectPair(client, pairs, topic);
        }
      }),
    );
  } catch (e) {
    log('Cleanup pairings error', e);
  }
}

export function bindEvents(
  client: Client,
  pairs: Pairs,
  onProcess: () => (topic: string, command: string, params: any) => Promise<any>,
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
    // Catch-all so a stray rejection doesn't surface as an Electron popup.
    try {
      await processSessionRequest(client, pairs, onProcess(), event);
    } catch (e) {
      log('Unhandled session_request error', e);
    }
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

import Client from '@walletconnect/sign-client';
import { getSdkError } from '@walletconnect/utils';
import initDebug from 'debug';

import { type Pairs } from '../hooks/useWalletConnectPairs';

const log = initDebug('chia-gui:walletConnect');

async function respondSessionRequestError(client: Client, topic: string, id: number, message: string) {
  try {
    await client.respond({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        error: {
          code: -32_600,
          message,
        },
      },
    });
  } catch (e) {
    // The dapp / WC SDK may have already evicted this request from its
    // store (5-minute default expiry, dapp went offline, race with
    // session disconnect). There's no recovery path: we can't apologize
    // to the dapp on a record that no longer exists. Log and move on.
    // Swallowing here keeps the error from becoming an uncaught
    // promise rejection in the `session_request` event listener, which
    // would otherwise surface as a popup the user can't act on.
    log('Failed to respond to session request', { topic, id }, e);
  }
}

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

    // WalletConnect SDK v2.17+ deprecated requiredNamespaces and moves them
    // to optionalNamespaces, so check both. When a dApp provides chia in both,
    // merge them so the approved session advertises all supported capabilities.
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

    // Unsupported-command warning removed: main filters this list at
    // PAIR_REGISTER (`filterRequestedCommands`) and the rejected set is
    // shown directly in the Pair dialog, which is the right surface for
    // the user to see that information.

    const pair = pairs.getPair(pairingTopic);
    if (!pair) {
      throw new Error('Pair not found');
    }

    // Capture the proposal but do NOT approve yet. The wallet selection and
    // permission grant happen in the main-process Pair dialog; once the user
    // confirms, approveSessionProposal sends the approve call with the picked
    // accounts.
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
  /**
   * mainnet vs testnet for this pair. Sourced from the renderer's
   * `useCurrencyCode()` at pair time — main also persists this on its YAML
   * PairRecord during `registerPair`. We pass it in rather than reading it
   * back from `permissionsAPI.listPairs()` because at this exact point we
   * already know it (caller just passed it to `registerPair` too).
   */
  mainnet: boolean,
  /**
   * Methods (`chia_<wcCommand>` form) the wallet is willing to honor for this
   * session. Must be the registry-filtered subset persisted on the pair
   * record — passing the dapp's raw `proposal.methods` undoes the filtering.
   */
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

/**
 * Best-effort cleanup of the main-side pair record (YAML grant +
 * spent-mojo budget). Failure here doesn't block the renderer-side
 * teardown — the WC SDK pairing is already gone, and a stale main record
 * is inert (its `commands` can never be used because the renderer has no
 * session to dispatch on its behalf). Logged for diagnostics, not surfaced
 * to the user.
 */
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
        await respondSessionRequestError(client, topic, id, 'Pair not found');
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
      throw new Error('Network not supported');
    }
    const isMainnet = instance === 'mainnet';

    // Pair-relevant gates (network match, fingerprint allowlist, commands
    // allowlist) all live in main now — `dispatchAsPair` calls
    // `checkPairAccess` with the wcCommand + fingerprint + mainnet we
    // pass below. Renderer-side duplicates were removed: there's one
    // source of truth and the renderer is no longer trusted for any of
    // these checks.

    const { fingerprint, ...rest } = params;
    const updatedParams = {
      ...rest,
      fingerprint: Number.parseInt(fingerprint, 10),
    };

    log('method', method, updatedParams);
    // `mainnet` is renderer-internal context (derived from chainId);
    // pass alongside params rather than mixing it into the dapp payload.
    // We pass `pair.topic` (the pair's topic) — main keys its PairRecord
    // by pair topic, not by WC session topic. The translation lives here
    // because the renderer is the only side that knows about sessions.
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
        await respondSessionRequestError(client, topic, id, (error as Error).message ?? 'Invalid Session Request');
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
    // Drop the main-side persisted grant + budget too. Without this a
    // disconnected dapp's `commands` and `spentMojos` would linger in
    // `dapp-pairs.yaml`, growing the file unbounded over time and leaving
    // dormant consents in place. Best-effort — see `revokeMainPair`.
    await revokeMainPair(topic);
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
      }),
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
    // Top-level catch-all. The WC SDK invokes this as a fire-and-forget
    // event listener, so any uncaught rejection becomes an unhandled
    // promise — which Electron surfaces as a user-visible error popup.
    // `processSessionRequest` already handles its own errors, this is
    // belt-and-braces for anything that slips past (expired records,
    // SDK internals, etc.).
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

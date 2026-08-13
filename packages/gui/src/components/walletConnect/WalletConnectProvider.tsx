import { useCurrencyCode } from '@chia-network/core';
import Client from '@walletconnect/sign-client';
import { type SignClientTypes } from '@walletconnect/types';
import { getSdkError } from '@walletconnect/utils';
import initDebug from 'debug';
import React, { type ReactNode, createContext, useEffect, useMemo, useRef, useCallback, useState } from 'react';

import type { PermissionsNotificationPayload, PermissionsPairRecord } from '../../@types/PermissionsService';
import { WcError, WcErrorCode, decodeWcErrorFromIpc } from '../../@types/WcError';
import useNotificationSettings from '../../hooks/useNotificationSettings';
import useNotifications from '../../hooks/useNotifications';
import useWalletConnectClient from '../../hooks/useWalletConnectClient';
import useWalletConnectCommand from '../../hooks/useWalletConnectCommand';
import useWalletConnectPreferences from '../../hooks/useWalletConnectPreferences';
import { isWalletConnectChainIdMainnet } from '../../util/isWalletConnectChainIdMainnet';
import shouldRouteDappNotification from '../../util/shouldRouteDappNotification';
import { waitForEvent } from '../../util/waitForEvent';

export const WalletConnectChiaProjectId = 'f3f661fcfc24e2e6e6c6f926f02c9c6e';
const log = initDebug('chia-gui:walletConnect');

async function respondSessionRequestError(
  client: Client,
  topic: string,
  id: number,
  message: string,
  code: number,
  // Forwarded to JSON-RPC `error.data` so dapp clients that canonicalize
  // `message` by code (many surface "Internal error" for `-32603` and only
  // expose the original payload through `error.data`) can still recover the
  // real failure detail.
  data?: unknown,
) {
  try {
    await client.respond({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        error: { code, message, ...(data !== undefined ? { data } : {}) },
      },
    });
  } catch (e) {
    // Dapp/SDK may have evicted the request (5-min expiry, disconnect race,
    // etc.). Swallow so the `session_request` listener doesn't surface an
    // uncaught rejection as a user-facing popup.
    log('Failed to respond to session request', { topic, id }, e);
  }
}

async function rejectSessionProposal(
  client: Client,
  proposal: SignClientTypes.EventArguments['session_proposal'],
  error: unknown,
) {
  try {
    await client.reject({
      id: proposal.id,
      reason: getSdkError('USER_REJECTED'),
    });
  } catch (e) {
    log('Failed to reject session proposal', { id: proposal.id, error }, e);
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

function processError(error: Error) {
  if (error.message.includes('No matching key')) {
    console.info('[chia-gui:walletConnect] Pairing not found (stale key, safe to ignore):', error.message);
    return;
  }

  throw error;
}

async function cleanupPairingsAndSessions(client: Client) {
  try {
    const pairs = await window.permissionsAPI.getPairs();

    // disconnect all sessions that are not in the pairs list
    const clientSessions = client.session.getAll();

    const sessionsToDisconnect = clientSessions.filter((s) => !pairs.some((p) => p.topic === s.pairingTopic));
    await Promise.all(
      sessionsToDisconnect.map((session) =>
        client.disconnect({
          topic: session.topic,
          reason: getSdkError('USER_DISCONNECTED'),
        }),
      ),
    );

    // disconnect all pairings that are not in the pairs list
    const clientPairings = client.pairing.getAll();

    const pairingsToDisconnect = clientPairings.filter(
      (clientPair) => !pairs.some((p) => clientPair.topic === p.topic),
    );

    await Promise.all(pairingsToDisconnect.map((pairing) => client.core.pairing.disconnect({ topic: pairing.topic })));
  } catch (e) {
    log('Cleanup pairings error', e);
    processError(e as Error);
  }
}

function getPairingTopicForSession(client: Client, sessionTopic: string): string | undefined {
  return client.session.getAll().find((session) => session.topic === sessionTopic)?.pairingTopic;
}

function parseFingerprint(fingerprint: unknown): number | undefined {
  if (fingerprint === undefined) {
    return undefined;
  }

  const parsedFingerprint = Number.parseInt(String(fingerprint), 10);
  if (Number.isNaN(parsedFingerprint)) {
    throw new WcError(
      `Invalid number value for argument fingerprint. Value: ${fingerprint}`,
      WcErrorCode.INVALID_PARAMS,
    );
  }

  return parsedFingerprint;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new Error('Pairing was cancelled');
  }
}

async function disconnectPair(client: Client, topic: string) {
  try {
    // revoke pair from main process
    await window.permissionsAPI.revokePair(topic);

    // get all sessions for the pairing
    const sessions = client.session.getAll();
    const relatedSessions = sessions.filter((s) => s.pairingTopic === topic);

    // disconnect all related sessions
    await Promise.all(
      relatedSessions.map((session) =>
        client.disconnect({
          topic: session.topic,
          reason: getSdkError('USER_DISCONNECTED'),
        }),
      ),
    );

    // disconnect the pairing
    await client.core.pairing.disconnect({ topic });
  } catch (e) {
    processError(e as Error);
  }
}

function parsePair(topic: string, mainnet: boolean, proposal: SignClientTypes.EventArguments['session_proposal']) {
  if (!proposal) {
    throw new Error('Proposal is required');
  }

  const {
    params: {
      pairingTopic,
      proposer: { metadata },
      optionalNamespaces,
      requiredNamespaces,
    },
  } = proposal;

  if (topic !== pairingTopic) {
    throw new Error('Pairing topic does not match');
  }

  // SDK v2.17+ moved requiredNamespaces to optionalNamespaces; merge both.
  const requiredChia = requiredNamespaces?.chia;
  const optionalChia = optionalNamespaces?.chia;

  if (!requiredChia && !optionalChia) {
    throw new Error('Missing required chia namespace');
  }

  const chains = [...new Set([...(requiredChia?.chains ?? []), ...(optionalChia?.chains ?? [])])];

  const currentChain = mainnet ? 'chia:mainnet' : 'chia:testnet';
  if (!chains.includes(currentChain)) {
    throw new Error(
      `This application does not support ${mainnet ? 'mainnet' : 'testnet'}. Switch networks and try again.`,
    );
  }

  const commands = [...new Set([...(requiredChia?.methods ?? []), ...(optionalChia?.methods ?? [])])];

  return {
    topic: pairingTopic,
    mainnet,
    metadata: {
      name: metadata?.name ?? 'Unknown application',
      url: metadata?.url,
      icon: metadata?.icons?.[0],
      description: metadata?.description,
    },
    commands,
  };
}

type Pair = PermissionsPairRecord & {
  sessions: number;
};

export const WalletConnectContext = createContext<
  | {
      enabled: boolean;
      isLoading: boolean;
      error: Error | undefined;
      pairs: Pair[];
      pair: (uri: string, options?: { signal?: AbortSignal }) => Promise<PermissionsPairRecord>;
      disconnectPair: (topic: string) => Promise<void>;
    }
  | undefined
>(undefined);

export type WalletConnectProviderProps = {
  children: ReactNode;
  projectId: string;
};

export default function WalletConnectProvider(props: WalletConnectProviderProps) {
  const { children, projectId } = props;

  const [pairs, setPairs] = useState<Pair[]>([]);
  const mainnet = useCurrencyCode() === 'XCH';
  const { showNotification } = useNotifications();
  const { dappOfferNotifications, dappAnnouncementNotifications } = useNotificationSettings();

  const { client, isLoading, error } = useWalletConnectClient({
    projectId,
  });

  const { process, isLoading: isLoadingWalletConnectCommand } = useWalletConnectCommand();
  const { enabled } = useWalletConnectPreferences();

  const clientRef = useRef(client);
  clientRef.current = client;

  const processRef = useRef(process);
  processRef.current = process;

  const isLoadingData = isLoading || isLoadingWalletConnectCommand;

  const updateListOfPairs = useCallback(async () => {
    const currentClient = clientRef.current;

    const currentPairs = await window.permissionsAPI.getPairs();

    const pairsWithSessions = currentPairs.map((pair) => ({
      ...pair,
      sessions: currentClient?.session.getAll().filter((s) => s.pairingTopic === pair.topic).length ?? 0,
    }));

    setPairs(pairsWithSessions);
  }, []);

  const handleDisconnectPair = useCallback(
    async (topic: string) => {
      const currentClient = clientRef.current;

      try {
        if (!currentClient) {
          throw new Error('Client not initialized');
        }

        await disconnectPair(currentClient, topic);
      } catch (e) {
        processError(e as Error);
      } finally {
        updateListOfPairs();
      }
    },
    [updateListOfPairs],
  );

  const processSessionRequest = useCallback(async (event: SignClientTypes.EventArguments['session_request']) => {
    const currentClient = clientRef.current;
    const currentProcess = processRef.current;

    try {
      if (!currentClient) {
        throw new Error('Client not initialized');
      }

      if (!currentProcess) {
        throw new Error('Process not initialized');
      }

      const {
        id,
        topic,
        params: {
          request: { method, params },
          chainId,
        },
      } = event;

      const pairTopic = getPairingTopicForSession(currentClient, topic);
      if (!pairTopic) {
        try {
          await respondSessionRequestError(currentClient, topic, id, 'Pairing not found', WcErrorCode.USER_REJECTED);
        } catch (e) {
          log('Failed to respond to session request without pairing:', e);
        }

        try {
          await currentClient.disconnect({ topic, reason: getSdkError('USER_DISCONNECTED') });
        } catch (e) {
          log('Failed to disconnect session without pairing:', e);
        }
        return;
      }

      const pair = await window.permissionsAPI.findPair(pairTopic);
      if (!pair) {
        try {
          await respondSessionRequestError(currentClient, topic, id, 'Pair not found', WcErrorCode.USER_REJECTED);
        } catch (e) {
          log('Failed to respond to orphan session request:', e);
        }

        try {
          await currentClient.disconnect({ topic, reason: getSdkError('USER_DISCONNECTED') });
        } catch (e) {
          log('Failed to disconnect orphan session:', e);
        }
        return;
      }

      const isMainnet = isWalletConnectChainIdMainnet(chainId);

      // parse fingerprint
      const { fingerprint, ...rest } = params;
      const commandParams = {
        ...rest,
      };

      const parsedFingerprint = parseFingerprint(fingerprint);
      if (parsedFingerprint !== undefined) {
        commandParams.fingerprint = parsedFingerprint;
      }

      log('method', method, commandParams);

      const result = await currentProcess(pairTopic, method, commandParams, { mainnet: isMainnet });
      log('result', result);

      await currentClient.respond({
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          result,
        },
      });
    } catch (sessionRequestError) {
      try {
        log('Session request error', sessionRequestError);

        const { id, topic } = event;
        if (currentClient) {
          const wc = toWcError(sessionRequestError);
          await respondSessionRequestError(currentClient, topic, id, wc.message, wc.code, wc.data);
        }
      } catch (e) {
        processError(e as Error);
      }
    }
  }, []);

  useEffect(() => {
    if (!client) {
      return undefined;
    }

    // cleanup pairings and sessions that are not in the pairs list anymore
    cleanupPairingsAndSessions(client);

    async function handleSessionRequest(event: SignClientTypes.EventArguments['session_request']) {
      try {
        await processSessionRequest(event);
      } catch (e) {
        log('Unhandled session_request error', e);
      }
    }

    async function handlePairingDelete(event: { topic: string }) {
      try {
        await handleDisconnectPair(event.topic);
      } catch (e) {
        log('Pairing delete error', e);
      }
    }

    updateListOfPairs();

    client.on('session_request', handleSessionRequest);
    client.core.pairing.events.on('pairing_delete', handlePairingDelete);

    return () => {
      client.off('session_request', handleSessionRequest);
      client.core.pairing.events.off('pairing_delete', handlePairingDelete);
    };
  }, [client, handleDisconnectPair, processSessionRequest, updateListOfPairs]);

  useEffect(
    () =>
      window.permissionsAPI.subscribeForNotifications((notification: PermissionsNotificationPayload) => {
        if (!shouldRouteDappNotification(notification, { dappOfferNotifications, dappAnnouncementNotifications })) {
          return;
        }

        showNotification(notification);
      }),
    [showNotification, dappOfferNotifications, dappAnnouncementNotifications],
  );

  const handlePair = useCallback(
    async (uri: string, options: { signal?: AbortSignal } = {}): Promise<PermissionsPairRecord> => {
      const { signal } = options;
      let pairingTopic: string | undefined;
      let proposal: SignClientTypes.EventArguments['session_proposal'] | undefined;
      let registeredPairTopic: string | undefined;

      try {
        throwIfAborted(signal);

        if (!client) {
          throw new Error('Client is not defined');
        }

        const { topic } = await client.core.pairing.pair({ uri });
        if (!topic) {
          throw new Error('Pairing failed');
        }
        pairingTopic = topic;
        throwIfAborted(signal);

        proposal = await waitForEvent<SignClientTypes.EventArguments, 'session_proposal'>(client, 'session_proposal', {
          timeoutMs: 15_000,
          signal,
          filter: (p: SignClientTypes.EventArguments['session_proposal']) => p.params?.pairingTopic === topic,
        });
        throwIfAborted(signal);

        const pair = parsePair(topic, mainnet, proposal);
        throwIfAborted(signal);

        const grant = await window.permissionsAPI.registerPair(pair);
        if (!grant) {
          throw new Error('Failed to register pair');
        }
        registeredPairTopic = pair.topic;
        throwIfAborted(signal);

        const { fingerprint, commands } = grant;
        if (!fingerprint) {
          throw new Error('A wallet must be selected');
        }

        const instance = mainnet ? 'mainnet' : 'testnet';
        const chain = `chia:${instance}`;

        const { acknowledged } = await client.approve({
          id: proposal.id,
          namespaces: {
            chia: {
              accounts: [`${chain}:${fingerprint}`],
              methods: commands,
              events: [],
            },
          },
        });
        throwIfAborted(signal);

        const result = await acknowledged();
        throwIfAborted(signal);
        if (!('topic' in result) || !result.topic) {
          throw new Error('Failed to approve session');
        }

        return grant;
      } catch (pairError) {
        if (client && proposal) {
          await rejectSessionProposal(client, proposal, pairError);
        }

        if (client && registeredPairTopic) {
          try {
            await disconnectPair(client, registeredPairTopic);
          } catch (e) {
            log('Failed to disconnect failed registered pair', { topic: registeredPairTopic }, e);
          }
        } else if (client && pairingTopic) {
          try {
            await client.core.pairing.disconnect({ topic: pairingTopic });
          } catch (e) {
            log('Failed to disconnect failed pairing', { topic: pairingTopic }, e);
          }
        }

        throw pairError;
      } finally {
        updateListOfPairs();
      }
    },
    [client, mainnet, updateListOfPairs],
  );

  const walletConnect = useMemo(
    () => ({
      enabled,
      isLoading: isLoadingData,
      error,

      pairs,
      pair: handlePair,
      disconnectPair: handleDisconnectPair,
    }),
    [enabled, error, handleDisconnectPair, handlePair, isLoadingData, pairs],
  );

  return <WalletConnectContext.Provider value={walletConnect}>{children}</WalletConnectContext.Provider>;
}

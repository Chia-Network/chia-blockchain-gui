import api, { store, useGetLoggedInFingerprintQuery } from '@chia-network/api-react';
import { useAuth } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import debug from 'debug';
import React from 'react';

import type Notification from '../@types/Notification';
import type Pair from '../@types/Pair';
import NotificationType from '../constants/NotificationType';
import walletConnectCommands from '../constants/WalletConnectCommands';
import prepareWalletConnectCommand from '../util/prepareWalletConnectCommand';
import waitForWalletSync from '../util/waitForWalletSync';

import useWalletConnectPairs from './useWalletConnectPairs';
import useWalletConnectPreferences from './useWalletConnectPreferences';

const log = debug('chia-gui:walletConnectCommand');

type UseWalletConnectCommandOptions = {
  onNotification?: (notification: Notification) => void;
};

function parseNotification(
  fingerprint: number,
  values: Record<string, string | number | boolean>,
  pair: Pair,
): Notification {
  const { type, allFingerprints, offerData } = values;

  const from = pair.metadata?.name ?? <Trans>Unknown Dapp</Trans>;
  const timestamp = Math.floor(new Date().getTime() / 1000);
  const fingerprints = allFingerprints ? pair.fingerprints : [fingerprint];

  const base = {
    from,
    timestamp,
    fingerprints,
  };

  const uniqueRandomId = `wc-${new Date().getTime()}-${Math.floor(Math.random() * 1_000_000_000)}`;

  if (type === NotificationType.OFFER) {
    if (!offerData) {
      throw new Error('Notification missing offerData');
    }

    return {
      ...base,
      type,
      source: 'WALLET_CONNECT',
      id: uniqueRandomId,
      offerData: offerData.toString(),
    };
  }

  if (type === NotificationType.ANNOUNCEMENT && 'message' in values) {
    return {
      ...base,
      type,
      source: 'WALLET_CONNECT',
      id: uniqueRandomId,
      message: values.message.toString(),
      url: 'url' in values ? values.url.toString() : undefined,
    };
  }

  throw new Error(`Invalid notification type ${type}`);
}

export default function useWalletConnectCommand(options: UseWalletConnectCommandOptions) {
  const { onNotification } = options;
  const { logIn } = useAuth();
  const { data: currentFingerprint, isLoading: isLoadingLoggedInFingerprint } = useGetLoggedInFingerprintQuery();
  const { getPairBySession } = useWalletConnectPairs();

  const { allowConfirmationFingerprintChange } = useWalletConnectPreferences();

  const isLoading = isLoadingLoggedInFingerprint;

  async function requestPermissions(topic: string, command: string, values: Record<string, unknown>) {
    const pair = getPairBySession(topic);
    if (!pair) {
      throw new Error('Invalid session topic');
    }

    if (command === 'requestPermissions') {
      const commands = Array.isArray(values.commands) ? values.commands.filter((cmd) => typeof cmd === 'string') : [];
      if (commands.length === 0 || commands.some((cmd) => cmd === 'requestPermissions')) {
        return false;
      }
      await window.appAPI.focusWindow();
      const result = await window.walletConnectAPI.promptPermissions({
        topic,
        requestedCommands: commands,
        metadata: pair.metadata ?? pair.sessions.find((session) => session.topic === topic)?.metadata ?? {},
      });
      return result.approved;
    }

    return true;
  }

  async function handleProcess(topic: string, requestedCommand: string, requestedParams: Record<string, unknown>) {
    const {
      command,
      values: defaultValues,
      definition,
    } = prepareWalletConnectCommand(walletConnectCommands, requestedCommand, requestedParams);

    const fingerprint = Number.parseInt(String(requestedParams.fingerprint), 10);

    if (command === 'showNotification') {
      const pair = getPairBySession(topic);
      if (!pair) {
        throw new Error('Invalid session topic');
      }

      const notification = parseNotification(fingerprint, defaultValues, pair);
      onNotification?.(notification);

      return {
        success: true,
      };
    }

    // validate fingerprint for current command
    const { allFingerprints, waitForSync } = definition;
    const hasCurrentFingerprint = currentFingerprint !== undefined && currentFingerprint !== null;
    const isDifferentFingerprint = hasCurrentFingerprint && fingerprint !== currentFingerprint;
    if (!allFingerprints) {
      if (isDifferentFingerprint && !allowConfirmationFingerprintChange) {
        throw new Error(`Invalid fingerprint ${fingerprint}`);
      }
    }

    const { service, serviceCommand } = definition;

    const values = defaultValues;

    const confirmed = await requestPermissions(topic, command, values);

    if (!confirmed) {
      throw new Error(`User cancelled command ${requestedCommand}`);
    }

    // auto login before execute command
    if (isDifferentFingerprint && allowConfirmationFingerprintChange) {
      log('Changing fingerprint', fingerprint);
      await logIn(fingerprint);
    }

    // wait for sync
    if (waitForSync) {
      log('Waiting for sync');
      // wait for wallet synchronisation
      await waitForWalletSync();

      if (!allFingerprints) {
        const fingerprintRequest = store.dispatch(
          api.endpoints.getLoggedInFingerprint.initiate(undefined, { forceRefetch: true }),
        );

        try {
          const latestFingerprint = await fingerprintRequest.unwrap();
          if (latestFingerprint !== fingerprint) {
            throw new Error('Fingerprint changed during execution');
          }
        } finally {
          fingerprintRequest.unsubscribe();
        }
      }
    }

    if (service === 'EXECUTE') {
      const execute = 'execute' in definition ? definition.execute : undefined;
      const result =
        typeof execute === 'function' ? await (execute as (localValues: typeof values) => unknown)(values) : execute;

      return {
        success: true,
        ...(result && typeof result === 'object' ? result : {}),
      };
    }

    // execute command
    log('Executing', command, values);
    const endpoint = serviceCommand ?? command;
    window.walletConnectRequestMeta = {
      topic,
      wcCommand: command,
      destination: service,
    };
    const resultPromise = store.dispatch(api.endpoints[endpoint].initiate(values));
    try {
      const result = await resultPromise;
      log('Result', result);
      return result;
    } finally {
      delete window.walletConnectRequestMeta;
      resultPromise.unsubscribe();
    }
  }

  return {
    isLoading,
    process: handleProcess,
  };
}

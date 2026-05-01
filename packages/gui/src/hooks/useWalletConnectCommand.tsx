import api, { store, useGetLoggedInFingerprintQuery } from '@chia-network/api-react';
import { useOpenDialog, useAuth } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import debug from 'debug';
import React, { type ReactNode } from 'react';

import type Notification from '../@types/Notification';
import type Pair from '../@types/Pair';
import type WalletConnectCommandParam from '../@types/WalletConnectCommandParam';
import WalletConnectConfirmDialog from '../components/walletConnect/WalletConnectConfirmDialog';
import WalletConnectRequestPermissionsConfirmDialog from '../components/walletConnect/WalletConnectRequestPermissionsConfirmDialog';
import NotificationType from '../constants/NotificationType';
import walletConnectCommands from '../constants/WalletConnectCommands';
import prepareWalletConnectCommand from '../util/prepareWalletConnectCommand';
import waitForWalletSync from '../util/waitForWalletSync';

import useWalletConnectPairs from './useWalletConnectPairs';
import useWalletConnectPreferences from './useWalletConnectPreferences';

const log = debug('chia-gui:walletConnectCommand');

function camelToSnake(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

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
  const openDialog = useOpenDialog();
  const { logIn } = useAuth();
  const { data: currentFingerprint, isLoading: isLoadingLoggedInFingerprint } = useGetLoggedInFingerprintQuery();
  const { getPairBySession } = useWalletConnectPairs();

  const { allowConfirmationFingerprintChange } = useWalletConnectPreferences();

  const isLoading = isLoadingLoggedInFingerprint;

  async function confirm(props: {
    topic: string;
    message: ReactNode;
    params: WalletConnectCommandParam[];
    values: Record<string, any>;
    fingerprint: number;
    isDifferentFingerprint: boolean;
    command: string;
    nsCommand?: string;
    bypassConfirm?: boolean;
    onChange: (values: Record<string, any>) => void;
  }) {
    const {
      topic,
      message,
      params = [],
      values,
      fingerprint,
      isDifferentFingerprint,
      command,
      nsCommand,
      bypassConfirm = false,
      onChange,
    } = props;

    const pair = getPairBySession(topic);
    if (!pair) {
      throw new Error('Invalid session topic');
    }

    if (pair.bypassCommands && command in pair.bypassCommands) {
      log(`bypassing command ${command} with value ${pair.bypassCommands[command]}`);
      return pair.bypassCommands[command];
    }

    // Ask the main process whether this command is pre-approved for this pair.
    // If main has a grant covering it, skip the renderer-side dialog entirely.
    if (nsCommand && window.permissionsAPI?.check) {
      try {
        // BigNumber instances do not survive IPC structured-clone (their
        // prototype is stripped). Round-trip through JSON so the values main
        // sees match what eventually gets sent on the wire.
        const data = JSON.parse(JSON.stringify(values ?? {}));
        const decision = await window.permissionsAPI.check({
          principal: { kind: 'pair', topic: pair.topic },
          command: nsCommand,
          data,
        });
        if (decision.kind === 'allow') return true;
        if (decision.kind === 'deny') return false;
      } catch (err) {
        log('permissionsAPI.check failed, falling back to renderer dialog', err);
      }
    }

    if (command === 'requestPermissions') {
      if (!values.commands || values.commands.some((cmd: string) => cmd === 'requestPermissions')) {
        return false;
      }
      const { bypassCommands } = pair;
      const hasPermissions = !!bypassCommands && values.commands.every((cmd: string) => bypassCommands[cmd]);
      if (hasPermissions) {
        return true;
      }
      // Bring the window to foreground when showing approval dialog
      await window.appAPI.focusWindow();
      const isConfirmed = await openDialog(
        <WalletConnectRequestPermissionsConfirmDialog
          topic={topic}
          fingerprint={fingerprint}
          isDifferentFingerprint={isDifferentFingerprint}
          params={params}
          values={values}
          onChange={onChange}
        />,
      );
      return isConfirmed;
    }

    // Bring the window to foreground when showing approval dialog
    await window.appAPI.focusWindow();
    const isConfirmed = await openDialog(
      <WalletConnectConfirmDialog
        topic={topic}
        command={command}
        message={message}
        fingerprint={fingerprint}
        isDifferentFingerprint={isDifferentFingerprint}
        bypassConfirm={bypassConfirm}
        params={params}
        values={values}
        onChange={onChange}
      />,
    );
    return isConfirmed;
  }

  async function handleProcess(topic: string, requestedCommand: string, requestedParams: any) {
    const {
      command,
      values: defaultValues,
      definition,
    } = prepareWalletConnectCommand(walletConnectCommands, requestedCommand, requestedParams);

    const { fingerprint } = requestedParams;

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

    const { service, params: definitionParams = [], bypassConfirm, serviceCommand } = definition;

    log('Confirm arguments', definitionParams);

    const nsCommand =
      service && service !== 'EXECUTE' ? `${service}.${camelToSnake(serviceCommand ?? command)}` : undefined;

    let values = defaultValues;

    function handleChangeParam(newValues: Record<string, any>) {
      values = newValues;
    }

    const confirmed = await confirm({
      topic,
      message:
        !allFingerprints && isDifferentFingerprint ? (
          <Trans>
            Do you want to log in to {fingerprint} and execute command {command}?
          </Trans>
        ) : (
          <Trans>Do you want to execute command {command}?</Trans>
        ),
      params: definitionParams,
      values,
      fingerprint,
      isDifferentFingerprint,
      command,
      nsCommand,
      bypassConfirm,
      onChange: handleChangeParam,
    });

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
      const { execute } = definition;
      const result = typeof execute === 'function' ? await execute(values) : execute;

      return {
        success: true,
        ...result,
      };
    }

    // execute command
    log('Executing', command, values);
    const pair = getPairBySession(topic);
    if (!pair) {
      throw new Error('Invalid session topic');
    }

    // 'NOTIFICATION' is handled at the top of this function (showNotification
    // branch); 'EXECUTE' was just handled above. Anything else is a real
    // ServiceNameValue carrying an RPC.
    if (service === 'NOTIFICATION') {
      throw new Error(`Unexpected NOTIFICATION service for command ${command}`);
    }

    // Dapp commands take the IPC-direct path: main owns the principal, the
    // permission flow, the spend commit, the wire envelope, and the response
    // correlation. The renderer just hands over (destination, command, data,
    // topic) and awaits the result. Crucially the renderer shares no
    // request-dispatch infrastructure with UI calls (RTK Query / Client /
    // WebSocketBridge), so there is no shared async context for a dapp
    // principal to leak through onto unrelated polling.
    const result = await window.permissionsAPI.dispatchAsPair({
      destination: service,
      command: camelToSnake(serviceCommand ?? command),
      data: values,
      topic: pair.topic,
    });
    log('Result', result);

    return result;
  }

  return {
    isLoading,
    process: handleProcess,
  };
}

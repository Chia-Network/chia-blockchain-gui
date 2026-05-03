import api, { store, useGetKeysQuery, useGetLoggedInFingerprintQuery } from '@chia-network/api-react';
import { useOpenDialog, useAuth } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import debug from 'debug';
import React from 'react';

import type Notification from '../@types/Notification';
import type Pair from '../@types/Pair';
import type WalletConnectCommandParam from '../@types/WalletConnectCommandParam';
import WalletConnectRequestPermissionsConfirmDialog from '../components/walletConnect/WalletConnectRequestPermissionsConfirmDialog';
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
  const openDialog = useOpenDialog();
  const { logIn } = useAuth();
  const { data: currentFingerprint, isLoading: isLoadingLoggedInFingerprint } = useGetLoggedInFingerprintQuery();
  const { getPairBySession } = useWalletConnectPairs();
  const { data: keys } = useGetKeysQuery({});

  const { allowConfirmationFingerprintChange } = useWalletConnectPreferences();

  const isLoading = isLoadingLoggedInFingerprint;

  async function confirm(props: {
    topic: string;
    params: WalletConnectCommandParam[];
    values: Record<string, any>;
    fingerprint: number;
    isDifferentFingerprint: boolean;
    command: string;
    onChange: (values: Record<string, any>) => void;
  }) {
    const { topic, params = [], values, fingerprint, isDifferentFingerprint, command, onChange } = props;

    const pair = getPairBySession(topic);
    if (!pair) {
      throw new Error('Invalid session topic');
    }

    // Pair-local "remember my choice" shortcut. Kept for backward compat with
    // existing pair entries; the toggle that writes to bypassCommands lived on
    // the (now-removed) WalletConnectConfirmDialog, so no new entries get
    // added through this path until that surface is reintroduced in main.
    if (pair.bypassCommands && command in pair.bypassCommands) {
      log(`bypassing command ${command} with value ${pair.bypassCommands[command]}`);
      return pair.bypassCommands[command];
    }

    // requestPermissions is a meta-command: it sets up `bypassCommands` rather
    // than invoking a daemon RPC, so it has its own renderer-side dialog and
    // never reaches dispatchAsPair.
    if (command === 'requestPermissions') {
      if (!values.commands || values.commands.some((cmd: string) => cmd === 'requestPermissions')) {
        return false;
      }
      const { bypassCommands } = pair;
      const hasPermissions = !!bypassCommands && values.commands.every((cmd: string) => bypassCommands[cmd]);
      if (hasPermissions) {
        return true;
      }
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

    // Everything else: trust dispatchAsPair to run resolvePermission and
    // surface main's Confirm dialog when approval is needed. No renderer-side
    // dialog — that was the source of the duplicate-confirmation bug.
    return true;
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

    const { service, params: definitionParams = [], serviceCommand } = definition;

    log('Confirm arguments', definitionParams);

    let values = defaultValues;

    function handleChangeParam(newValues: Record<string, any>) {
      values = newValues;
    }

    const confirmed = await confirm({
      topic,
      params: definitionParams,
      values,
      fingerprint,
      isDifferentFingerprint,
      command,
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
    // permission flow, the spend commit, the wire envelope, the response
    // correlation, AND any per-command display enrichment shown in the
    // Confirm dialog. The renderer hands over (destination, wcCommand,
    // data, topic) and awaits the result. Anything the user sees at
    // confirmation time is computed by main from `data` (via daemon RPCs
    // for asset names, offer summaries, NFT thumbnails) so a compromised
    // renderer can't lie about what's being asked.
    //
    // The daemon RPC name is *not* computed here — main owns that mapping
    // (see `electron/utils/wcRpcResolver.ts`). The renderer just sends the
    // WC command name (camelCase) and main resolves it.
    const labelFor = (fp?: number): string | undefined => {
      if (fp === undefined) return undefined;
      const found = keys?.find((k: { fingerprint: number; label?: string | null }) => k.fingerprint === fp);
      return found?.label ?? undefined;
    };
    const result = await window.permissionsAPI.dispatchAsPair({
      destination: service,
      wcCommand: serviceCommand ?? command,
      data: values,
      topic: pair.topic,
      fingerprint: {
        requested: fingerprint,
        current: hasCurrentFingerprint ? currentFingerprint : undefined,
        requestedLabel: labelFor(fingerprint),
        currentLabel: hasCurrentFingerprint ? labelFor(currentFingerprint) : undefined,
      },
    });
    log('Result', result);

    return result;
  }

  return {
    isLoading,
    process: handleProcess,
  };
}

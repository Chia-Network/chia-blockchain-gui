import api, { store, useGetLoggedInFingerprintQuery, useLogInMutation } from '@chia-network/api-react';
import { useOpenDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import debug from 'debug';
import React, { ReactNode } from 'react';

import type WalletConnectCommandParam from '../@types/WalletConnectCommandParam';
import WalletConnectConfirmDialog from '../components/walletConnect/WalletConnectConfirmDialog';
import walletConnectCommands from '../constants/WalletConnectCommands';
import prepareWalletConnectCommand from '../util/prepareWalletConnectCommand';
import waitForWalletSync from '../util/waitForWalletSync';
import useWalletConnectPairs from './useWalletConnectPairs';
import useWalletConnectPreferences from './useWalletConnectPreferences';

const log = debug('chia-gui:walletConnectCommand');

export default function useWalletConnectCommand() {
  const openDialog = useOpenDialog();
  const [logIn] = useLogInMutation();
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
      />
    );

    return isConfirmed;
  }

  async function handleProcess(topic: string, requestedCommand: string, requestedParams: any) {
    const {
      command,
      values: defaultValues,
      definition,
    } = prepareWalletConnectCommand(walletConnectCommands, requestedCommand, requestedParams);

    // validate fingerprint for current command
    const { allFingerprints, waitForSync } = definition;
    const { fingerprint } = requestedParams;
    const isDifferentFingerprint = fingerprint !== currentFingerprint;
    if (!allFingerprints) {
      if (isDifferentFingerprint && !allowConfirmationFingerprintChange) {
        throw new Error(`Invalid fingerprint ${fingerprint}`);
      }
    }

    const { params: definitionParams = [], bypassConfirm } = definition;

    log('Confirm arguments', definitionParams);

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
      bypassConfirm,
      onChange: handleChangeParam,
    });

    if (!confirmed) {
      throw new Error(`User cancelled command ${requestedCommand}`);
    }

    // auto login before execute command
    if (isDifferentFingerprint && allowConfirmationFingerprintChange) {
      log('Changing fingerprint', fingerprint);
      await logIn({
        fingerprint,
        type: 'skip',
      }).unwrap();
    }

    // wait for sync
    if (waitForSync) {
      log('Waiting for sync');
      // wait for wallet synchronisation
      await waitForWalletSync();
    }

    // validate current fingerprint again
    const currentLoggedInFingerptintPromise = store.dispatch(api.endpoints.getLoggedInFingerprint.initiate());
    const { data: currentFingerprintAfterWait } = await currentLoggedInFingerptintPromise;
    currentLoggedInFingerptintPromise.unsubscribe();

    if (currentFingerprintAfterWait !== fingerprint) {
      throw new Error(`Fingerprint changed during execution`);
    }

    // execute command
    log('Executing', command, values);
    const resultPromise = store.dispatch(api.endpoints[command].initiate(values));
    const result = await resultPromise;
    log('Result', result);

    // Removing the corresponding cache subscription
    resultPromise.unsubscribe();

    return result;
  }

  return {
    isLoading,
    process: handleProcess,
  };
}

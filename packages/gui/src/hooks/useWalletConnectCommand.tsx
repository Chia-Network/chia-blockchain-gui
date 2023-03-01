import api, {
  store,
  useGetLoggedInFingerprintQuery,
  useLogInAndSkipImportMutation,
  useGetKeysQuery,
} from '@chia-network/api-react';
import { useOpenDialog, ConfirmDialog, Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Divider, Typography } from '@mui/material';
import debug from 'debug';
import React, { ReactNode } from 'react';

import type WalletConnectCommandParam from '../@types/WalletConnectCommandParam';
import WalletConnectCommandParamName from '../@types/WalletConnectCommandParamName';
import WalletConnectMetadata from '../components/walletConnect/WalletConnectMetadata';
import walletConnectCommands from '../constants/WalletConnectCommands';
import prepareWalletConnectCommand from '../util/prepareWalletConnectCommand';
import waitForWalletSync from '../util/waitForWalletSync';
import useWalletConnectPairs from './useWalletConnectPairs';
import useWalletConnectPreferences from './useWalletConnectPreferences';

const log = debug('chia-gui:walletConnectCommand');

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

export default function useWalletConnectCommand() {
  const openDialog = useOpenDialog();
  const [logIn] = useLogInAndSkipImportMutation();
  const { data: currentFingerprint, isLoading: isLoadingLoggedInFingerprint } = useGetLoggedInFingerprintQuery();
  const { getPairBySession } = useWalletConnectPairs();
  const { data: keys, isLoading: isLoadingPublicKeys } = useGetKeysQuery();
  const { allowConfirmationFingerprintChange } = useWalletConnectPreferences();

  const isLoading = isLoadingLoggedInFingerprint || isLoadingPublicKeys;

  async function confirm(props: {
    topic: string;
    message: ReactNode;
    params: {
      name: WalletConnectCommandParamName;
      label: ReactNode;
      value: ReactNode;
      displayComponent?: (value: ReactNode, params: WalletConnectCommandParam[]) => ReactNode;
    }[];
    fingerprint: number;
    isDifferentFingerprint: boolean;
  }) {
    const { topic, message, params = [], fingerprint, isDifferentFingerprint } = props;

    /*
    const { autoConfirm } = state.current;
    if (autoConfirm) {
      return true;
    }
    */

    const key = keys?.find((item) => item.fingerprint === fingerprint);

    const pair = getPairBySession(topic);
    if (!pair) {
      throw new Error('Invalid session topic');
    }

    const isConfirmed = await openDialog(
      <ConfirmDialog
        title={<Trans>Confirmation Request</Trans>}
        confirmColor="primary"
        confirmTitle={<Trans>Confirm</Trans>}
        cancelTitle={<Trans>Reject</Trans>}
      >
        <Flex flexDirection="column" gap={2}>
          <Typography variant="body1">{message}</Typography>

          {params.length > 0 && (
            <Flex flexDirection="column" gap={2}>
              {params.map(({ label, value, displayComponent }) => (
                <Flex flexDirection="column" key={label}>
                  <Typography color="textPrimary">{label}</Typography>
                  <Typography color="textSecondary">
                    {displayComponent
                      ? displayComponent(value, params)
                      : value?.toString() ?? <Trans>Not Available</Trans>}
                  </Typography>
                </Flex>
              ))}
            </Flex>
          )}

          <Divider />
          <Flex flexDirection="column" gap={1}>
            <Typography variant="body1" color="textPrimary">
              <Trans>Key</Trans>
            </Typography>
            {!!key && (
              <Typography variant="body1" color={isDifferentFingerprint ? 'warning' : 'textSecondary'}>
                {key.label ?? <Trans>Wallet</Trans>}
              </Typography>
            )}

            <Typography variant="body2" color={isDifferentFingerprint ? 'warning' : 'textSecondary'}>
              {fingerprint}
            </Typography>
          </Flex>

          <Divider />

          <Flex flexDirection="column" gap={1}>
            <Typography variant="body1" color="textPrimary">
              <Trans>Application</Trans>
            </Typography>
            <WalletConnectMetadata metadata={pair.metadata} />
          </Flex>
        </Flex>
      </ConfirmDialog>
    );

    return isConfirmed;
  }

  async function handleProcess(topic: string, requestedCommand: string, requestedParams: any) {
    const { command, params, definition } = prepareWalletConnectCommand(
      walletConnectCommands,
      requestedCommand,
      requestedParams
    );

    // validate fingerprint for current command
    const { allFingerprints, waitForSync } = definition;
    const { fingerprint } = requestedParams;
    const isDifferentFingerprint = fingerprint !== currentFingerprint;
    if (!allFingerprints) {
      if (isDifferentFingerprint && !allowConfirmationFingerprintChange) {
        throw new Error(`Invalid fingerprint ${fingerprint}`);
      }
    }

    const confirmParams: {
      name: WalletConnectCommandParamName;
      label: ReactNode;
      value: ReactNode;
      displayComponent?: (value: any, params: WalletConnectCommandParam[]) => ReactNode;
    }[] = [];

    const { params: definitionParams = [] } = definition;
    definitionParams.forEach((param) => {
      const { name, label, displayComponent, hide } = param;

      if (name in params && !hide) {
        confirmParams.push({
          name,
          label: label ?? name,
          value: params[name],
          displayComponent,
        });
      }
    });

    log('Confirm arguments', confirmParams);

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
      params: confirmParams,
      fingerprint,
      isDifferentFingerprint,
    });

    if (!confirmed) {
      throw new Error(`User cancelled command ${requestedCommand}`);
    }

    // auto login before execute command
    if (isDifferentFingerprint && allowConfirmationFingerprintChange) {
      log('Changing fingerprint', fingerprint);
      await logIn({
        fingerprint,
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
    log('Executing', command, params);
    const resultPromise = store.dispatch(api.endpoints[command].initiate(params));
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

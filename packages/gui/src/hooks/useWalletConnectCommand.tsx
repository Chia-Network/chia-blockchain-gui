import React, { useRef, useCallback, ReactNode } from 'react';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import debug from 'debug';
import { useOpenDialog, ConfirmDialog, Flex, FormatLargeNumber } from '@chia/core';
import { Divider, Typography } from '@mui/material';
import api, { store, useGetLoggedInFingerprintQuery, useLogInAndSkipImportMutation } from '@chia/api-react';
import useWalletConnectPrefs from './useWalletConnectPrefs';
import useWalletConnectPairs from './useWalletConnectPairs';
import WalletConnectMetadata from '../components/walletConnect/WalletConnectMetadata';
import prepareWalletConnectCommand from '../util/prepareWalletConnectCommand';
import walletConnectCommands from '../constants/WalletConnectCommands';

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
  const { data: currentFingerprint, isLoading } = useGetLoggedInFingerprintQuery();
  const { autoConfirm, allowConfirmationFingerprintChange } = useWalletConnectPrefs();
  const { getPairBySession } = useWalletConnectPairs();

  const state = useRef({
    currentFingerprint,
    autoConfirm,
    allowConfirmationFingerprintChange,
  });

  state.current.currentFingerprint = currentFingerprint;
  state.current.autoConfirm = autoConfirm;
  state.current.allowConfirmationFingerprintChange = allowConfirmationFingerprintChange;

  async function confirm(props: {
    topic: string;
    message: ReactNode;
    params: {
      label: ReactNode;
      value: ReactNode;
      displayComponent?: (value: ReactNode) => ReactNode;
    }[];
  }) {
    const { topic, message, params = [] } = props;

    /*
    const { autoConfirm } = state.current;
    if (autoConfirm) {
      return true;
    }
    */

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
              {params.map(({ label, value, displayComponent }, index) => {
                return (
                  <Flex flexDirection="column" key={index}>
                    <Typography color="textPrimary">{label}</Typography>
                    <Typography color="textSecondary">
                      {displayComponent ? displayComponent(value) : value?.toString() ?? <Trans>Not Available</Trans>}
                    </Typography>
                  </Flex>
                );
              })}
            </Flex>
          )}

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

  const handleProcess = useCallback(async (topic, requestedCommand: string, requestedParams: any) => {
    const { command, params, definition } = prepareWalletConnectCommand(
      walletConnectCommands,
      requestedCommand,
      requestedParams
    );

    const { allowConfirmationFingerprintChange } = state.current;

    // validate fingerprint for current command
    const { allFingerprints } = definition;
    const { fingerprint } = requestedParams;
    const isSameFingerprint = fingerprint === state.current.currentFingerprint;
    if (!allFingerprints) {
      if (!isSameFingerprint && !allowConfirmationFingerprintChange) {
        throw new Error(`Invalid fingerprint ${fingerprint}`);
      }
    }

    const confirmParams: {
      label: ReactNode;
      value: ReactNode;
      displayComponent?: (value: any) => ReactNode;
    }[] = [];

    const { params: definitionParams = [] } = definition;
    definitionParams.forEach((param) => {
      const { name, label, displayComponent } = param;

      if (name in params) {
        confirmParams.push({
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
        !allFingerprints && !isSameFingerprint ? (
          <Trans>
            Do you want to log in to {fingerprint} and execute command {command}?
          </Trans>
        ) : (
          <Trans>Do you want to execute command {command}?</Trans>
        ),
      params: confirmParams,
    });

    if (!confirmed) {
      throw new Error(`User cancelled command ${requestedCommand}`);
    }

    // auto login before execute command
    if (!isSameFingerprint && allowConfirmationFingerprintChange) {
      log('Changing fingerprint', fingerprint);
      await logIn({
        fingerprint,
      }).unwrap();
    }

    log('Executing', command, params);

    // execute command
    const resultPromise = store.dispatch(api.endpoints[command].initiate(params));

    const result = await resultPromise;
    log('Result', result);

    // Removing the corresponding cache subscription
    resultPromise.unsubscribe();

    return result;
  }, []);

  return {
    isLoading,
    process: handleProcess,
  };
}

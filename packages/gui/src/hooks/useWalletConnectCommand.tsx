import React, { useRef, useCallback, ReactNode } from 'react';
import { Trans } from '@lingui/macro';
import {
  useOpenDialog,
  mojoToChiaLocaleString,
  useLocale,
  useCurrencyCode,
  ConfirmDialog,
  Flex,
} from '@chia/core';
import { Divider, Typography } from '@mui/material';
import {
  api,
  store,
  useGetLoggedInFingerprintQuery,
  useGetSyncStatusQuery,
} from '@chia/api-react';
import useWalletConnectPrefs from './useWalletConnectPrefs';
import useWalletConnectPairs from './useWalletConnectPairs';
import WalletConnectMetadata from '../components/walletConnect/WalletConnectMetadata';
import prepareWalletConnectCommand from '../util/prepareWalletConnectCommand';
import walletConnectCommands from '../constants/WalletConnectCommands';

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
  const [locale] = useLocale();
  const { data: currentFingerprint, isLoading } =
    useGetLoggedInFingerprintQuery();
  const currencyCode = useCurrencyCode();
  const { autoConfirm } = useWalletConnectPrefs();
  const walletSyncState = useGetSyncStatusQuery(
    {},
    {
      pollingInterval: 10000,
    },
  );
  const { getPairBySession } = useWalletConnectPairs();

  const state = useRef({
    currentFingerprint,
    currencyCode,
    walletSyncState,
    autoConfirm,
  });

  state.current.currentFingerprint = currentFingerprint;
  state.current.currencyCode = currencyCode;
  state.current.walletSyncState = walletSyncState;
  state.current.autoConfirm = autoConfirm;

  async function confirm(
    topic: string,
    message: ReactNode,
    attributes: { label: ReactNode; value: ReactNode }[] = [],
  ) {
    const { autoConfirm } = state.current;
    if (autoConfirm) {
      return true;
    }

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

          {attributes.length > 0 && (
            <Flex flexDirection="column" gap={2}>
              {attributes.map(({ label, value }, index) => (
                <Flex flexDirection="column" key={index}>
                  <Typography color="textPrimary">{label}</Typography>
                  <Typography color="textSecondary">{value}</Typography>
                </Flex>
              ))}
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
      </ConfirmDialog>,
    );

    return isConfirmed;
  }

  const handleProcess = useCallback(
    async (topic, requestedCommand: string, requestedParams: any) => {
      const { command, params, definition } = prepareWalletConnectCommand(
        walletConnectCommands,
        requestedCommand,
        requestedParams,
      );

      // validate fingerprint for current command
      const { allFingerprints } = definition;
      if (!allFingerprints) {
        const { fingerprint } = requestedParams;
        if (fingerprint !== state.current.currentFingerprint) {
          throw new Error(`Invalid fingerprint ${fingerprint}`);
        }
      }

      const confirmArguments: {
        label: ReactNode;
        value: ReactNode;
      }[] = [];

      const { params: definitionParams = [] } = definition;
      definitionParams.forEach((param) => {
        const { name, label } = param;

        if (name in params) {
          confirmArguments.push({
            label: label ?? name,
            value: params[name],
          });
        }
      });

      const confirmed = await confirm(
        topic,
        <Trans>Do you want to execute command {command}?</Trans>,
        confirmArguments,
      );

      if (!confirmed) {
        throw new Error(`User cancelled command ${requestedCommand}`);
      }

      // execute command
      const resultPromise = store.dispatch(
        api.endpoints[command].initiate(params),
      );

      const result = await resultPromise;

      // Removing the corresponding cache subscription
      resultPromise.unsubscribe();

      return result;
    },
    [],
  );

  return {
    isLoading,
    process: handleProcess,
  };
}

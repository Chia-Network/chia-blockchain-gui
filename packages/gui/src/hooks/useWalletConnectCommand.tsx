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
  useGetLoggedInFingerprintQuery,
  useSendTransactionMutation,
  useGetNextAddressMutation,
} from '@chia/api-react';
import { JsonRpcResponse } from '@walletconnect/jsonrpc-types';
import BigNumber from 'bignumber.js';
import useWalletConnectPrefs from './useWalletConnectPrefs';
import useWalletConnectPairs from './useWalletConnectPairs';
import WalletConnectMetadata from '../components/walletConnect/WalletConnectMetadata';

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
  const [sendTransaction] = useSendTransactionMutation();
  const [newAddress] = useGetNextAddressMutation();
  const { getPairBySession } = useWalletConnectPairs();

  const state = useRef({
    currentFingerprint,
  });

  state.current.currentFingerprint = currentFingerprint;

  async function confirm(topic: string, message: ReactNode) {
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
          <Flex flexDirection="column" gap={1}>
            <Typography variant="body1">{message}</Typography>
          </Flex>

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

  async function chiaSendTransaction(
    topic: string,
    params: {
      to: string;
      amount: string;
      fee: string;
    },
  ): Promise<JsonRpcResponse<any>> {
    const { to, amount, fee = '0' } = params;

    const amountChia = mojoToChiaLocaleString(amount, locale);
    const feeChia = mojoToChiaLocaleString(fee, locale);

    const confirmed = await confirm(
      topic,
      <Trans>
        Do you want to send {amountChia}&nbsp;{currencyCode} with a fee of{' '}
        {feeChia}&nbsp;
        {currencyCode} to {to}?
      </Trans>,
    );

    if (!confirmed) {
      throw new Error('User cancelled send transaction');
    }

    return sendTransaction({
      walletId: 1,
      address: to,
      amount: new BigNumber(amount),
      fee: new BigNumber(fee),
      waitForConfirmation: true,
    }).unwrap();
  }

  async function chiaNewAddress(topic: string) {
    const confirmed = await confirm(
      topic,
      <Trans>Do you want to use new receive address?</Trans>,
    );
    if (!confirmed) {
      throw new Error('User cancelled command newAddress');
    }

    const address = await newAddress({
      walletId: 1,
      newAddress: true,
    }).unwrap();

    return {
      address,
    };
  }

  const handleProcess = useCallback(
    async (topic, fingerprint: number, command: string, params: any) => {
      if (fingerprint !== state.current.currentFingerprint) {
        throw new Error('Invalid fingerprint');
      }

      switch (command) {
        case 'chia_sendTransaction':
          return chiaSendTransaction(topic, params);
        case 'chia_newAddress':
          return chiaNewAddress(topic);
        // case 'chia_logIn':
        // return chiaLogIn(topic, params);
        default:
          throw new Error(`Unknown command ${command}`);
      }
    },
    [],
  );

  return {
    isLoading,
    process: handleProcess,
  };
}

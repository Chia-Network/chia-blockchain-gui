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
  useLogInAndSkipImportMutation,
  useSignMessageByAddressMutation,
  useSignMessageByIdMutation,
} from '@chia/api-react';
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
  const [logIn] = useLogInAndSkipImportMutation();
  const [signMessageByAddress] = useSignMessageByAddressMutation();
  const [signMessageById] = useSignMessageByIdMutation();
  const { getPairBySession } = useWalletConnectPairs();

  const state = useRef({
    currentFingerprint,
    currencyCode,
  });

  state.current.currentFingerprint = currentFingerprint;
  state.current.currencyCode = currencyCode;

  async function confirm(
    topic: string,
    message: ReactNode,
    attributes: { label: ReactNode; value: ReactNode }[] = [],
  ) {
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

          {attributes.length && (
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

  async function chiaSendTransaction(
    topic: string,
    params: {
      to: string;
      amount: string;
      fee: string;
      fingerprint: number;
    },
  ) {
    const { currencyCode } = state.current;
    const { fingerprint, to, amount, fee = '0' } = params;
    if (fingerprint !== state.current.currentFingerprint) {
      throw new Error('Invalid fingerprint');
    }

    const amountChia = mojoToChiaLocaleString(amount, locale);
    const feeChia = mojoToChiaLocaleString(fee, locale);

    const confirmed = await confirm(
      topic,
      <Trans>Do you want to send transaction?</Trans>,
      [
        {
          label: <Trans>Amount</Trans>,
          value: `${amountChia} ${currencyCode}`,
        },
        {
          label: <Trans>Fee</Trans>,
          value: `${feeChia} ${currencyCode}`,
        },
        {
          label: <Trans>To</Trans>,
          value: to,
        },
      ],
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

  async function chiaNewAddress(
    topic: string,
    params: {
      fingerprint: number;
    },
  ) {
    const { fingerprint } = params;
    if (fingerprint !== state.current.currentFingerprint) {
      throw new Error('Invalid fingerprint');
    }

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

  async function chiaLogIn(
    topic: string,
    params: {
      fingerprint: number;
    },
  ) {
    const { fingerprint } = params;
    const confirmed = await confirm(
      topic,
      <Trans>Do you want to use wallet: {fingerprint}?</Trans>,
    );
    if (!confirmed) {
      throw new Error('User cancelled command logIn');
    }

    const response = await logIn({
      fingerprint,
    }).unwrap();

    return {
      response,
    };
  }

  async function chiaSignMessageByAddress(
    topic: string,
    params: {
      fingerprint: number;
      address: string;
      message: string;
    },
  ) {
    const { fingerprint, address, message } = params;
    if (fingerprint !== state.current.currentFingerprint) {
      throw new Error('Invalid fingerprint');
    }

    const confirmed = await confirm(
      topic,
      <Trans>Do you want to sign message by address?</Trans>,
      [
        {
          label: <Trans>Address</Trans>,
          value: address,
        },
        {
          label: <Trans>Message</Trans>,
          value: message,
        },
      ],
    );
    if (!confirmed) {
      throw new Error('User cancelled command signInMessageByAddress');
    }

    return signMessageByAddress({
      address,
      message,
    }).unwrap();
  }

  async function chiaSignMessageById(
    topic: string,
    params: {
      fingerprint: number;
      id: string;
      message: string;
    },
  ) {
    const { fingerprint, id, message } = params;
    if (fingerprint !== state.current.currentFingerprint) {
      throw new Error('Invalid fingerprint');
    }

    const confirmed = await confirm(
      topic,
      <Trans>Do you want to sign message by id?</Trans>,
      [
        {
          label: <Trans>Id</Trans>,
          value: id,
        },
        {
          label: <Trans>Message</Trans>,
          value: message,
        },
      ],
    );
    if (!confirmed) {
      throw new Error('User cancelled command signInMessageById');
    }

    return signMessageById({
      id,
      message,
    }).unwrap();
  }

  const handleProcess = useCallback(
    async (topic, command: string, params: any) => {
      switch (command) {
        case 'chia_sendTransaction':
          return chiaSendTransaction(topic, params);
        case 'chia_newAddress':
          return chiaNewAddress(topic, params);
        case 'chia_logIn':
          return chiaLogIn(topic, params);
        case 'chia_signMessageByAddress':
          return chiaSignMessageByAddress(topic, params);
        case 'chia_signMessageById':
          return chiaSignMessageById(topic, params);
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

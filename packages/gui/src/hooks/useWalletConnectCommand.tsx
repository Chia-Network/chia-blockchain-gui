import React, { useRef, useCallback } from 'react';
import { Trans } from '@lingui/macro';
import {
  useOpenDialog,
  mojoToChiaLocaleString,
  useLocale,
  ConfirmDialog,
} from '@chia/core';
import {
  useGetLoggedInFingerprintQuery,
  useSendTransactionMutation,
  useGetNextAddressMutation,
} from '@chia/api-react';
import { JsonRpcResponse } from '@walletconnect/jsonrpc-types';
import BigNumber from 'bignumber.js';

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
  const [sendTransaction] = useSendTransactionMutation();
  const [newAddress] = useGetNextAddressMutation();

  const state = useRef({
    currentFingerprint,
  });

  state.current.currentFingerprint = currentFingerprint;

  async function chiaSendTransaction(params: {
    to: string;
    amount: string;
    fee: string;
  }): Promise<JsonRpcResponse<any>> {
    const { to, amount, fee = '0' } = params;

    const amountChia = mojoToChiaLocaleString(amount, locale);
    const feeChia = mojoToChiaLocaleString(fee, locale);

    const send = await openDialog(
      <ConfirmDialog
        title={<Trans>Please confirm send transaction</Trans>}
        confirmColor="danger"
      >
        <Trans>
          Do you want to send {amountChia} to {to} with a fee of {feeChia}?
        </Trans>
      </ConfirmDialog>,
    );

    if (!send) {
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

  async function chiaNewAddress() {
    const confirmed = await openDialog(
      <ConfirmDialog
        title={<Trans>Please confirm new address</Trans>}
        confirmColor="danger"
      >
        <Trans>Do you want to use new receive address?</Trans>
      </ConfirmDialog>,
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
    async (fingerprint: number, command: string, params: any) => {
      if (fingerprint !== state.current.currentFingerprint) {
        throw new Error('Invalid fingerprint');
      }

      switch (command) {
        case 'chia_sendTransaction':
          return chiaSendTransaction(params);
        case 'chia_newAddress':
          return chiaNewAddress();
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

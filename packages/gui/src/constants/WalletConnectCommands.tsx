import React from 'react';
import { Trans } from '@lingui/macro';
import { ServiceName } from '@chia/api';
import type WalletConnectCommand from '../@types/WalletConnectCommand';

const walletConnectCommands: WalletConnectCommand[] = [
  {
    command: 'sendTransaction',
    label: <Trans>Send Transaction</Trans>,
    service: ServiceName.WALLET,
    args: [
      {
        name: 'amount',
        label: <Trans>Amount</Trans>,
        type: 'string',
      },
      {
        name: 'fee',
        label: <Trans>Fee</Trans>,
        type: 'string',
      },
      {
        name: 'address',
        label: <Trans>Address</Trans>,
        type: 'string',
      },
      {
        name: 'walletId',
        label: 'Wallet ID',
        type: 'number',
        defaultValue: 1,
      },
    ],
  },
  {
    command: 'logIn',
    label: 'Log in',
    service: ServiceName.WALLET,
    allFingerprints: true,
    args: [
      {
        name: 'fingerprint',

        type: 'number',
        label: <Trans>Fingerprint</Trans>,
      },
    ],
  },
  {
    command: 'signMessageById',
    label: 'Sign message by id',
    service: ServiceName.WALLET,
    args: [
      {
        name: 'id',
        label: <Trans>Id</Trans>,
        type: 'string',
      },
      {
        name: 'message',
        label: <Trans>Message</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'signMessageByAddress',
    label: 'Sign message by address',
    service: ServiceName.WALLET,
    args: [
      {
        name: 'address',
        label: <Trans>Address</Trans>,
        type: 'string',
      },
      {
        name: 'message',
        label: <Trans>Message</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'newAddress',
    label: 'Update receive address',
    service: ServiceName.WALLET,
  },
];

export default walletConnectCommands;

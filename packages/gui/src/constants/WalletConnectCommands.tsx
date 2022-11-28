import React from 'react';
import { Trans } from '@lingui/macro';
import { ServiceName } from '@chia/api';
import { MojoToChia } from '@chia/core';
import type WalletConnectCommand from '../@types/WalletConnectCommand';

const walletConnectCommands: WalletConnectCommand[] = [
  {
    command: 'logIn',
    label: <Trans>Log In</Trans>,
    service: ServiceName.WALLET,
    allFingerprints: true,
    params: [
      {
        name: 'fingerprint',
        type: 'number',
        label: <Trans>Fingerprint</Trans>,
      },
    ],
  },

  {
    command: 'getWallets',
    label: <Trans>Get Wallets</Trans>,
    service: ServiceName.WALLET,
  },
  {
    command: 'getTransaction',
    label: <Trans>Get Transaction</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'transactionId',
        type: 'string',
        label: <Trans>Transaction Id</Trans>,
      },
    ],
  },
  {
    command: 'getWalletBalance',
    label: <Trans>Get Wallet Balance</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'walletId',
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
        isOptional: true,
        defaultValue: 1,
      },
    ],
  },
  {
    command: 'getCurrentAddress',
    label: <Trans>Get Current Address</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'walletId',
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
        isOptional: true,
        defaultValue: 1,
      },
    ],
  },

  {
    command: 'sendTransaction',
    label: <Trans>Send Transaction</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'amount',
        label: <Trans>Amount</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
      {
        name: 'fee',
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
      {
        name: 'address',
        label: <Trans>Address</Trans>,
        type: 'string',
      },
      {
        name: 'walletId',
        label: <Trans>Wallet ID</Trans>,
        type: 'number',
        defaultValue: 1,
      },
      {
        name: 'waitForConfirmation',
        label: <Trans>Wait for Confirmation</Trans>,
        type: 'boolean',
        isOptional: true,
      },
    ],
  },
  {
    command: 'signMessageById',
    label: <Trans>Sign Message by Id</Trans>,
    service: ServiceName.WALLET,
    params: [
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
    label: <Trans>Sign Message by Address</Trans>,
    service: ServiceName.WALLET,
    params: [
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
    command: 'getNextAddress',
    label: <Trans>Get Next Address</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'walletId',
        label: <Trans>Wallet Id</Trans>,
        isOptional: true,
        defaultValue: 1,
        type: 'number',
      },
      {
        name: 'newAddress',
        label: <Trans>New Address</Trans>,
        isOptional: true,
        defaultValue: true,
        type: 'boolean',
      },
    ],
  },
  {
    command: 'getSyncStatus',
    label: <Trans>Get Wallet Sync Status</Trans>,
    service: ServiceName.WALLET,
  },

  // offers
  {
    command: 'getAllOffers',
    label: <Trans>Get all Offers</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'start',
        label: <Trans>Start</Trans>,
        isOptional: true,
        type: 'number',
      },
      {
        name: 'end',
        label: <Trans>End</Trans>,
        isOptional: true,
        type: 'number',
      },
      {
        name: 'sortKey',
        label: <Trans>Start Key</Trans>,
        isOptional: true,
        type: 'string',
      },
      {
        name: 'reverse',
        label: <Trans>Reverse</Trans>,
        isOptional: true,
        type: 'boolean',
      },
      {
        name: 'includeMyOffers',
        label: <Trans>Include My Offers</Trans>,
        isOptional: true,
        type: 'boolean',
      },
      {
        name: 'includeTakenOffers',
        label: <Trans>Include Taken Offers</Trans>,
        isOptional: true,
        type: 'boolean',
      },
    ],
  },
  {
    command: 'getOffersCount',
    label: <Trans>Get Offers Count</Trans>,
    service: ServiceName.WALLET,
  },
  {
    command: 'createOfferForIds',
    label: <Trans>Create Offer for Ids</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'walletIdsAndAmounts',
        label: <Trans>Wallet Ids and Amounts</Trans>,
        type: 'object',
      },
      {
        name: 'driverDict',
        label: <Trans>Driver Dict</Trans>,
        type: 'object',
      },
      {
        name: 'validateOnly',
        label: <Trans>Validate only</Trans>,
        isOptional: true,
        type: 'boolean',
      },
      {
        name: 'disableJSONFormatting',
        label: <Trans>Disable JSON Formatting</Trans>,
        isOptional: true,
        type: 'boolean',
      },
    ],
  },
  {
    command: 'cancelOffer',
    label: <Trans>Cancel Offer</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'tradeId',
        label: <Trans>Trade Id</Trans>,
        type: 'string',
      },
      {
        name: 'secure',
        label: <Trans>Secure</Trans>,
        type: 'boolean',
      },
      {
        name: 'fee',
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
    ],
  },
  {
    command: 'checkOfferValidity',
    label: <Trans>Check Offer Validity</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'offerData',
        label: <Trans>Offer Data</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'takeOffer',
    label: <Trans>Take Offer</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'offer',
        label: <Trans>Offer</Trans>,
        type: 'string',
      },
      {
        name: 'fee',
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
    ],
  },
  {
    command: 'getOfferSummary',
    label: <Trans>Get Offer Summary</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'offerData',
        label: <Trans>Offer Data</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'getOfferData',
    label: <Trans>Get Offer Data</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'offerId',
        label: <Trans>Offer Id</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'getOfferRecord',
    label: <Trans>Get Offer Record</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'offerId',
        label: <Trans>Offer Id</Trans>,
        type: 'string',
      },
    ],
  },

  // CAT
  {
    command: 'createNewCATWallet',
    label: <Trans>Create new CAT Wallet</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'amount',
        label: <Trans>Amount</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
      {
        name: 'fee',
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
    ],
  },
  {
    command: 'getCATAssetId',
    label: <Trans>Get CAT Asset Id</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'walletId',
        label: <Trans>Wallet Id</Trans>,
        type: 'number',
      },
    ],
  },
  {
    command: 'spendCAT',
    label: <Trans>Spend CAT</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'walletId',
        label: <Trans>Wallet Id</Trans>,
        type: 'number',
      },
      {
        name: 'address',
        label: <Trans>Address</Trans>,
        type: 'string',
      },
      {
        name: 'amount',
        label: <Trans>Amount</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
      {
        name: 'fee',
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
      {
        name: 'memos',
        label: <Trans>Memos</Trans>,
        isOptional: true,
      },
      {
        name: 'waitForConfirmation',
        label: <Trans>Wait for Confirmation</Trans>,
        type: 'boolean',
        isOptional: true,
      },
    ],
  },
  {
    command: 'addCATToken',
    label: <Trans>Add CAT Token</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'assetId',
        label: <Trans>Asset Id</Trans>,
        type: 'string',
      },
      {
        name: 'name',
        label: <Trans>Name</Trans>,
        type: 'string',
      },
      {
        name: 'fee',
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
    ],
  },

  // NFTs
  {
    command: 'getNFTs',
    label: <Trans>Get NFTs</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'walletIds',
        label: <Trans>Wallet Ids</Trans>,
      },
    ],
  },
  {
    command: 'getNFTInfo',
    label: <Trans>Get NFT Info</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'coinId',
        label: <Trans>Coin Id</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'transferNFT',
    label: <Trans>Transfer NFT</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: 'walletId',
        label: <Trans>Wallet Id</Trans>,
        type: 'number',
      },
      {
        name: 'nftCoinId',
        label: <Trans>NFT Coin Id</Trans>,
        type: 'string',
      },
      {
        name: 'launcherId',
        label: <Trans>Launcher Id</Trans>,
        type: 'string',
      },
      {
        name: 'targetAddress',
        label: <Trans>Target Address</Trans>,
        type: 'string',
      },
      {
        name: 'fee',
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
    ],
  },
];

export default walletConnectCommands;

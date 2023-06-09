import { ServiceName } from '@chia-network/api';
import { MojoToChia } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import React from 'react';

import type WalletConnectCommand from '../@types/WalletConnectCommand';
import WalletConnectCommandParamName from '../@types/WalletConnectCommandParamName';
import WalletConnectCATAmount from '../components/walletConnect/WalletConnectCATAmount';
import WalletConnectCreateOfferPreview from '../components/walletConnect/WalletConnectCreateOfferPreview';
import WalletConnectOfferPreview from '../components/walletConnect/WalletConnectOfferPreview';

const walletConnectCommands: WalletConnectCommand[] = [
  {
    command: 'logIn',
    label: <Trans>Log In</Trans>,
    service: ServiceName.WALLET,
    allFingerprints: true,
    params: [
      {
        name: WalletConnectCommandParamName.FINGERPRINT,
        type: 'number',
        label: <Trans>Fingerprint</Trans>,
      },
    ],
  },
  {
    command: 'getWallets',
    label: <Trans>Get Wallets</Trans>,
    description: <Trans>Requests a complete listing of the wallets associated with the current wallet key</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.INCLUDE_DATA,
        type: 'boolean',
        label: <Trans>Include Wallet Metadata</Trans>,
      },
    ],
  },
  {
    command: 'getTransaction',
    label: <Trans>Get Transaction</Trans>,
    description: <Trans>Requests details for a specific transaction</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.TRANSACTION_ID,
        type: 'string',
        label: <Trans>Transaction Id</Trans>,
      },
    ],
  },
  {
    command: 'getWalletBalance',
    label: <Trans>Get Wallet Balance</Trans>,
    description: <Trans>Requests the asset balance for a specific wallet associated with the current wallet key</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
        isOptional: true,
        defaultValue: 1,
        hide: true,
      },
    ],
  },
  {
    command: 'getWalletBalances',
    label: <Trans>Get Wallet Balances</Trans>,
    description: <Trans>Requests the asset balances for specific wallets associated with the current wallet key</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_IDS,
        type: 'object',
        label: <Trans>Wallet Ids</Trans>,
        isOptional: true,
        defaultValue: undefined,
        hide: false,
      },
    ],
  },
  {
    command: 'getCurrentAddress',
    label: <Trans>Get Current Address</Trans>,
    description: <Trans>Requests the current receive address associated with the current wallet key</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
        isOptional: true,
        defaultValue: 1,
        hide: true,
      },
    ],
  },

  {
    command: 'sendTransaction',
    label: <Trans>Send Transaction</Trans>,
    service: ServiceName.WALLET,
    waitForSync: true,
    params: [
      {
        name: WalletConnectCommandParamName.AMOUNT,
        label: <Trans>Amount</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
      {
        name: WalletConnectCommandParamName.ADDRESS,
        label: <Trans>Address</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        label: <Trans>Wallet ID</Trans>,
        type: 'number',
        defaultValue: 1,
        hide: true,
      },
      {
        name: WalletConnectCommandParamName.MEMOS,
        label: <Trans>Memos</Trans>,
        // type: 'string[]', ??
        isOptional: true,
        hide: true,
      },
      {
        name: WalletConnectCommandParamName.PUZZLE_DECORATOR,
        label: <Trans>Puzzle Decorator</Trans>,
        type: 'object',
        isOptional: true,
        // hide: true,
      },
    ],
  },
  {
    command: 'signMessageById',
    label: <Trans>Sign Message by Id</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.MESSAGE,
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
        name: WalletConnectCommandParamName.ADDRESS,
        label: <Trans>Address</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.MESSAGE,
        label: <Trans>Message</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'verifySignature',
    label: <Trans>Verify Signature</Trans>,
    description: <Trans>Requests the verification status for a digital signature</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.MESSAGE,
        label: <Trans>Message</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.PUBKEY,
        label: <Trans>Public Key</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.SIGNATURE,
        label: <Trans>Signature</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.ADDRESS,
        label: <Trans>Address</Trans>,
        type: 'string',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.SIGNING_MODE,
        label: <Trans>Signing Mode</Trans>,
        type: 'string',
        isOptional: true,
      },
    ],
  },
  {
    command: 'getNextAddress',
    label: <Trans>Get Next Address</Trans>,
    description: <Trans>Requests a new receive address associated with the current wallet key</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        label: <Trans>Wallet Id</Trans>,
        isOptional: true,
        defaultValue: 1,
        type: 'number',
        hide: true,
      },
      {
        name: WalletConnectCommandParamName.NEW_ADDRESS,
        label: <Trans>New Address</Trans>,
        isOptional: true,
        defaultValue: true,
        type: 'boolean',
        hide: true,
      },
    ],
  },
  {
    command: 'getSyncStatus',
    label: <Trans>Get Wallet Sync Status</Trans>,
    description: <Trans>Requests the syncing status of current wallet</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
  },

  // offers
  {
    command: 'getAllOffers',
    label: <Trans>Get all Offers</Trans>,
    description: <Trans>Requests a complete listing of the offers associated with the current wallet key</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.START,
        label: <Trans>Start</Trans>,
        isOptional: true,
        type: 'number',
      },
      {
        name: WalletConnectCommandParamName.END,
        label: <Trans>End</Trans>,
        isOptional: true,
        type: 'number',
      },
      {
        name: WalletConnectCommandParamName.SORT_KEY,
        label: <Trans>Start Key</Trans>,
        isOptional: true,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.REVERSE,
        label: <Trans>Reverse</Trans>,
        isOptional: true,
        type: 'boolean',
      },
      {
        name: WalletConnectCommandParamName.INCLUDE_MY_OFFERS,
        label: <Trans>Include My Offers</Trans>,
        isOptional: true,
        type: 'boolean',
      },
      {
        name: WalletConnectCommandParamName.INCLUDE_TAKEN_OFFERS,
        label: <Trans>Include Taken Offers</Trans>,
        isOptional: true,
        type: 'boolean',
      },
    ],
  },
  {
    command: 'getOffersCount',
    label: <Trans>Get Offers Count</Trans>,
    description: <Trans>Requests the number of offers associated with the current wallet key</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
  },
  {
    command: 'createOfferForIds',
    label: <Trans>Create Offer for Ids</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: WalletConnectCommandParamName.OFFER,
        label: <Trans>Wallet Ids and Amounts</Trans>,
        type: 'object',
        displayComponent: (value, params, values, onChange) => (
          <WalletConnectCreateOfferPreview value={value} params={params} values={values} onChange={onChange} />
        ),
      },
      {
        name: WalletConnectCommandParamName.DRIVER_DICT,
        label: <Trans>Driver Dict</Trans>,
        type: 'object',
        displayComponent: (value) => <>{JSON.stringify(value)}</>,
      },
      {
        name: WalletConnectCommandParamName.VALIDATE_ONLY,
        label: <Trans>Validate only</Trans>,
        isOptional: true,
        type: 'boolean',
      },
      {
        name: WalletConnectCommandParamName.DISABLE_JSON_FORMATTING,
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
        name: WalletConnectCommandParamName.TRADE_ID,
        label: <Trans>Trade Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.SECURE,
        label: <Trans>Secure</Trans>,
        type: 'boolean',
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
    ],
  },
  {
    command: 'checkOfferValidity',
    label: <Trans>Check Offer Validity</Trans>,
    description: <Trans>Requests the validity status of a specific offer</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.OFFER,
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
        name: WalletConnectCommandParamName.OFFER,
        label: <Trans>Offer</Trans>,
        type: 'string',
        displayComponent: (value, params, values, onChange) => (
          <WalletConnectOfferPreview value={value} params={params} values={values} onChange={onChange} />
        ),
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
    ],
  },
  {
    command: 'getOfferSummary',
    label: <Trans>Get Offer Summary</Trans>,
    description: <Trans>Requests the summarized details of a specific offer</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.OFFER_DATA,
        label: <Trans>Offer Data</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'getOfferData',
    label: <Trans>Get Offer Data</Trans>,
    description: <Trans>Requests the raw offer data for a specific offer</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.OFFER_ID,
        label: <Trans>Offer Id</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'getOfferRecord',
    label: <Trans>Get Offer Record</Trans>,
    service: ServiceName.WALLET,
    description: <Trans>Requests the details for a specific offer</Trans>,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.OFFER_ID,
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
        name: WalletConnectCommandParamName.AMOUNT,
        label: <Trans>Amount</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
    ],
  },
  {
    command: 'getCATWalletInfo',
    label: <Trans>Get CAT Wallet Info</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.ASSET_ID,
        label: <Trans>Asset Id</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'getCATAssetId',
    label: <Trans>Get CAT Asset Id</Trans>,
    description: <Trans>Requests the CAT asset ID for a specific CAT wallet</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        label: <Trans>Wallet Id</Trans>,
        type: 'number',
      },
    ],
  },
  {
    command: 'spendCAT',
    label: <Trans>Spend CAT</Trans>,
    service: ServiceName.WALLET,
    waitForSync: true,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        label: <Trans>Wallet Id</Trans>,
        type: 'number',
      },
      {
        name: WalletConnectCommandParamName.ADDRESS,
        label: <Trans>Address</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.AMOUNT,
        label: <Trans>Amount</Trans>,
        type: 'BigNumber',
        displayComponent: (value, _params, values) => <WalletConnectCATAmount amount={value} values={values} />,
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
      {
        name: WalletConnectCommandParamName.MEMOS,
        label: <Trans>Memos</Trans>,
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
        name: WalletConnectCommandParamName.ASSET_ID,
        label: <Trans>Asset Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.NAME,
        label: <Trans>Name</Trans>,
        type: 'string',
      },
    ],
  },

  // NFTs
  {
    command: 'getNFTs',
    label: <Trans>Get NFTs</Trans>,
    description: (
      <Trans>
        Requests a full or paginated listing of NFTs associated with one or more wallets associated with the current
        wallet key
      </Trans>
    ),
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_IDS,
        label: <Trans>Wallet Ids</Trans>,
      },
      {
        name: WalletConnectCommandParamName.NUM,
        label: <Trans>Number of NFTs</Trans>,
        type: 'number',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.START_INDEX,
        label: <Trans>Start Index</Trans>,
        type: 'number',
        isOptional: true,
      },
    ],
  },
  {
    command: 'getNFTInfo',
    label: <Trans>Get NFT Info</Trans>,
    description: <Trans>Requests details for a specific NFT</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.COIN_ID,
        label: <Trans>Coin Id</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'mintNFT',
    label: <Trans>Mint NFT</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        label: <Trans>Wallet Id</Trans>,
        type: 'number',
      },
      {
        name: WalletConnectCommandParamName.ROYALTY_ADDRESS,
        label: <Trans>Royalty Address</Trans>,
        type: 'string',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.ROYALTY_PERCENTAGE,
        label: <Trans>Royalty Percentage</Trans>,
        type: 'BigNumber',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.TARGET_ADDRESS,
        label: <Trans>Target Address</Trans>,
        type: 'string',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.URIS,
        label: <Trans>Uris</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.HASH,
        label: <Trans>Hash</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.META_URIS,
        label: <Trans>Meta Uris</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.META_HASH,
        label: <Trans>Meta Hash</Trans>,
        type: 'string',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.LICENSE_URIS,
        label: <Trans>License Uris</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.LICENSE_HASH,
        label: <Trans>License Hash</Trans>,
        type: 'string',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.EDITION_NUMBER,
        label: <Trans>Edition Number</Trans>,
        type: 'number',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.EDITION_TOTAL,
        label: <Trans>Edition Total</Trans>,
        type: 'number',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.DID_ID,
        label: <Trans>DID Id</Trans>,
        type: 'string',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
        isOptional: true,
      },
    ],
  },
  {
    command: 'transferNFT',
    label: <Trans>Transfer NFT</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        label: <Trans>Wallet Id</Trans>,
        type: 'number',
      },
      {
        name: WalletConnectCommandParamName.NFT_COIN_IDS,
        label: <Trans>NFT Coin Ids</Trans>,
        type: 'object',
      },
      {
        name: WalletConnectCommandParamName.TARGET_ADDRESS,
        label: <Trans>Target Address</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
    ],
  },
  {
    command: 'getNFTsCount',
    label: <Trans>Get NFTs Count</Trans>,
    description: (
      <Trans>
        Requests the number of NFTs associated with one or more wallets associated with the current wallet key
      </Trans>
    ),
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_IDS,
        label: <Trans>Wallet Ids</Trans>,
      },
    ],
  },

  // DIDs
  {
    command: 'createNewDIDWallet',
    label: <Trans>Create new DID Wallet</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: WalletConnectCommandParamName.AMOUNT,
        label: <Trans>Amount</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
      {
        name: WalletConnectCommandParamName.BACKUP_DIDS,
        label: <Trans>Backup DIDs</Trans>,
      },
      {
        name: WalletConnectCommandParamName.NUM_OF_BACKUP_IDS_NEEDED,
        label: <Trans>Number of Backup Ids Needed</Trans>,
        type: 'number',
      },
    ],
  },
  {
    command: 'setDIDName',
    label: <Trans>Set DID Name</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
      },
      {
        name: WalletConnectCommandParamName.NAME,
        label: <Trans>Name</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'setNFTDID',
    label: <Trans>Set NFT DID</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
      },
      {
        name: WalletConnectCommandParamName.NFT_LAUNCHER_ID,
        label: <Trans>NFT Launcher Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.NFT_COIN_IDS,
        label: <Trans>NFT Coin Ids</Trans>,
      },
      {
        name: WalletConnectCommandParamName.DID,
        label: <Trans>DID</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
      },
    ],
  },
  {
    command: 'getNFTWalletsWithDIDs',
    label: <Trans>Get NFT Wallets with DIDs</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
  },
  {
    command: 'getVCList',
    label: <Trans>Get All Verifiable Credentials</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
  },
  {
    command: 'getVC',
    label: <Trans>Get Verifiable Credential</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.VC_ID,
        type: 'string',
        label: <Trans>Launcher Id</Trans>,
      },
    ],
  },
  {
    command: 'spendVC',
    label: <Trans>Add Proofs To Verifiable Credential</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.VC_ID,
        type: 'string',
        label: <Trans>Launcher Id</Trans>,
      },
      {
        name: WalletConnectCommandParamName.NEW_PUZHASH,
        type: 'string',
        label: <Trans>New Puzzle Hash</Trans>,
      },
      {
        name: WalletConnectCommandParamName.NEW_PROOF_HASH,
        type: 'string',
        label: <Trans>New Proof Hash</Trans>,
      },
      {
        name: WalletConnectCommandParamName.PROVIDER_INNER_PUZHASH,
        type: 'string',
        label: <Trans>Provider Inner Puzzle Hash</Trans>,
      },
      {
        name: WalletConnectCommandParamName.FEE,
        type: 'number',
        label: <Trans>Spend Fee</Trans>,
      },
      {
        name: WalletConnectCommandParamName.REUSE_PUZHASH,
        type: 'boolean',
        label: <Trans>Reuse Puzzle Hash</Trans>,
      },
    ],
  },
  {
    command: 'addVCProofs',
    label: <Trans>Add Proofs</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.PROOFS,
        type: 'object',
        label: <Trans>Proofs Object (Key Value Pairs)</Trans>,
      },
    ],
  },
  {
    command: 'getProofsForRoot',
    label: <Trans>Get Proofs For Root Hash</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.ROOT,
        type: 'string',
        label: <Trans>Proofs Hash</Trans>,
      },
    ],
  },
  {
    command: 'revokeVC',
    label: <Trans>Revoke Verifiable Credential</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.VC_PARENT_ID,
        type: 'string',
        label: <Trans>Parent Coin Info</Trans>,
      },
    ],
  },
  {
    command: 'showNotification',
    label: <Trans>Show notification with offer or general announcement</Trans>,
    service: 'NOTIFICATION',
    params: [
      {
        name: WalletConnectCommandParamName.TYPE,
        type: 'string',
        label: <Trans>Type</Trans>,
      },
      {
        name: WalletConnectCommandParamName.MESSAGE,
        type: 'string',
        label: <Trans>Message</Trans>,
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.URL,
        type: 'string',
        label: <Trans>URL</Trans>,
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.OFFER_DATA,
        type: 'string',
        label: <Trans>Offer Data</Trans>,
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.ALL_FINGERPRINTS,
        type: 'boolean',
        label: <Trans>Is notification visible to all paired fingerprints</Trans>,
        isOptional: true,
      },
    ],
  },
];

export default walletConnectCommands;

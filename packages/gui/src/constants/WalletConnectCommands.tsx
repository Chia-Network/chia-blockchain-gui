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
    command: 'spendClawbackCoins',
    label: <Trans>Claw back or claim claw back transaction</Trans>,
    service: ServiceName.WALLET,
    waitForSync: true,
    params: [
      {
        name: WalletConnectCommandParamName.COIN_IDS,
        label: <Trans>Coin Ids</Trans>,
        type: 'object',
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
      {
        name: WalletConnectCommandParamName.IS_HEX,
        label: <Trans>Message Is Hex Encoded String</Trans>,
        type: 'boolean',
        isOptional: true,
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
      {
        name: WalletConnectCommandParamName.IS_HEX,
        label: <Trans>Message Is Hex Encoded String</Trans>,
        type: 'boolean',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.SAFE_MODE,
        label: (
          <Trans>
            WARNING! When safeMode=false it means you could be signing a transaction, not just a message. Be sure you
            trust the source that's requesting this.
          </Trans>
        ),
        type: 'boolean',
        isOptional: true,
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
  {
    command: 'pushTx',
    label: <Trans>Push Transaction</Trans>,
    description: <Trans>Push a spend bundle (transaction) to the blockchain</Trans>,
    service: ServiceName.FULL_NODE,
    params: [
      {
        name: WalletConnectCommandParamName.SPEND_BUNDLE,
        label: <Trans>Spend Bundle</Trans>,
        type: 'object',
      },
    ],
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
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>Fee</Trans>,
        isOptional: true,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
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
    command: 'mintBulk',
    label: <Trans>Mint Bulk</Trans>,
    description: <Trans>Create a spend bundle to mint multiple NFTs</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        label: <Trans>Wallet Id</Trans>,
        type: 'number',
      },
      {
        name: WalletConnectCommandParamName.METADATA_LIST,
        label: <Trans>Metadata List</Trans>,
        type: 'object',
      },
      {
        name: WalletConnectCommandParamName.ROYALTY_PERCENTAGE,
        label: <Trans>Royalty Percentage</Trans>,
        type: 'BigNumber',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.ROYALTY_ADDRESS,
        label: <Trans>Royalty Address</Trans>,
        type: 'string',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.TARGET_LIST,
        label: <Trans>Target List</Trans>,
        type: 'object',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.MINT_NUMBER_START,
        label: <Trans>Mint Start Number</Trans>,
        type: 'number',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.MINT_TOTAL,
        label: <Trans>Mint Total</Trans>,
        type: 'number',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.XCH_COIN_LIST,
        label: <Trans>XCH Coin List</Trans>,
        type: 'object',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.XCH_CHANGE_TARGET,
        label: <Trans>XCH Change Target</Trans>,
        type: 'string',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.NEW_INNERPUZHASH,
        label: <Trans>New Inner Puzzle Hash</Trans>,
        type: 'object',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.NEW_P2_PUZHASH,
        label: <Trans>New P2 Puzzle Hash</Trans>,
        type: 'string',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.DID_COIN_DICT,
        label: <Trans>DID Coin Dictionary</Trans>,
        type: 'object',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.DID_LINEAGE_PARENT_HEX,
        label: <Trans>DID Lineage Parent Hex</Trans>,
        type: 'string',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.MINT_FROM_DID,
        label: <Trans>Mint From DID</Trans>,
        type: 'boolean',
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>Fee</Trans>,
        type: 'BigNumber',
        displayComponent: (value) => <MojoToChia value={value} />,
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.REUSE_PUZHASH,
        label: <Trans>Reuse Puzzle Hash</Trans>,
        type: 'boolean',
        isOptional: true,
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
        type: 'object',
      },
      {
        name: WalletConnectCommandParamName.HASH,
        label: <Trans>Hash</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.META_URIS,
        label: <Trans>Meta Uris</Trans>,
        type: 'object',
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
        type: 'object',
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

  // DataLayer
  {
    command: 'addMirror',
    label: <Trans>Add Mirror</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.URLS,
        label: <Trans>URLs</Trans>,
        type: 'object',
      },
      {
        name: WalletConnectCommandParamName.AMOUNT,
        label: <Trans>Amount</Trans>,
        type: 'number',
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>FEE</Trans>,
        type: 'number',
      },
    ],
  },
  {
    command: 'addMissingFiles',
    label: <Trans>Add Missing Files</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.IDS,
        label: <Trans>Store Ids</Trans>,
        type: 'object',
      },
      {
        name: WalletConnectCommandParamName.OVERRIDE,
        label: <Trans>Override</Trans>,
        type: 'boolean',
      },
      {
        name: WalletConnectCommandParamName.FOLDER_NAME,
        label: <Trans>Folder Name</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'batchUpdate',
    label: <Trans>Batch Update</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.CHANGELIST,
        label: <Trans>Changelist</Trans>,
        type: 'object',
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>FEE</Trans>,
        type: 'number',
      },
    ],
  },
  {
    command: 'cancelDataLayerOffer',
    label: <Trans>Cancel DataLayer Offer</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.TRADE_ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.SECURE,
        label: <Trans>URLs</Trans>,
        type: 'boolean',
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>FEE</Trans>,
        type: 'number',
      },
    ],
  },
  {
    command: 'checkPlugins',
    label: <Trans>Check Plugins</Trans>,
    service: ServiceName.DATALAYER,
    params: [],
  },
  {
    command: 'clearPendingRoots',
    label: <Trans>Clear Pending Roots</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'createDataStore',
    label: <Trans>Create DataStore</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>FEE</Trans>,
        type: 'number',
      },
    ],
  },
  {
    command: 'deleteKey',
    label: <Trans>Delete Key</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.KEY,
        label: <Trans>Key</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>FEE</Trans>,
        type: 'number',
      },
    ],
  },
  {
    command: 'deleteMirror',
    label: <Trans>Delete Mirror</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Coin Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>FEE</Trans>,
        type: 'number',
      },
    ],
  },
  {
    command: 'getAncestors',
    label: <Trans>Get Ancestors</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.HASH,
        label: <Trans>Hash</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'getKeys',
    label: <Trans>Get Keys</Trans>,
    service: ServiceName.DATALAYER,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.ROOT_HASH,
        label: <Trans>Root Hash</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'getKeysValues',
    label: <Trans>Get Keys Values</Trans>,
    service: ServiceName.DATALAYER,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.ROOT_HASH,
        label: <Trans>Root Hash</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'getKvDiff',
    label: <Trans>Get Kv Diff</Trans>,
    service: ServiceName.DATALAYER,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.HASH1,
        label: <Trans>Hash 1</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.HASH2,
        label: <Trans>Hash 2</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'getLocalRoot',
    label: <Trans>Get Local Root</Trans>,
    service: ServiceName.DATALAYER,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'getMirrors',
    label: <Trans>Get Mirrors</Trans>,
    service: ServiceName.DATALAYER,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'getOwnedStores',
    label: <Trans>Get Owned Stores</Trans>,
    service: ServiceName.DATALAYER,
    bypassConfirm: true,
    params: [],
  },
  {
    command: 'getRoot',
    label: <Trans>Get Root</Trans>,
    service: ServiceName.DATALAYER,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'getRoots',
    label: <Trans>Get Roots</Trans>,
    service: ServiceName.DATALAYER,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.IDS,
        label: <Trans>Store Ids</Trans>,
        type: 'object',
      },
    ],
  },
  {
    command: 'getRootHistory',
    label: <Trans>Get Root History</Trans>,
    service: ServiceName.DATALAYER,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'getDataLayerSyncStatus',
    label: <Trans>Get DataLayer Sync Status</Trans>,
    service: ServiceName.DATALAYER,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'getValue',
    label: <Trans>Get Value</Trans>,
    service: ServiceName.DATALAYER,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.KEY,
        label: <Trans>Key</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.ROOT_HASH,
        label: <Trans>Root Hash</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'insert',
    label: <Trans>Insert</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.KEY,
        label: <Trans>Key</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.VALUE,
        label: <Trans>Value</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>Fee</Trans>,
        type: 'number',
      },
    ],
  },
  {
    command: 'makeDataLayerOffer',
    label: <Trans>Make DataLayer Offer</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.MAKER,
        label: <Trans>Maker</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>Fee</Trans>,
        type: 'number',
      },
    ],
  },
  {
    command: 'removeSubscriptions',
    label: <Trans>Remove Subscriptions</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.URLS,
        label: <Trans>URLs</Trans>,
        type: 'object',
      },
    ],
  },
  {
    command: 'subscribe',
    label: <Trans>Subscribe</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.URLS,
        label: <Trans>URLs</Trans>,
        type: 'object',
      },
    ],
  },
  {
    command: 'subscriptions',
    label: <Trans>Subscriptions</Trans>,
    service: ServiceName.DATALAYER,
    params: [],
  },
  {
    command: 'takeDataLayerOffer',
    label: <Trans>Take DataLayer Offer</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.OFFER,
        label: <Trans>Offer</Trans>,
        type: 'string',
      },
      {
        name: WalletConnectCommandParamName.FEE,
        label: <Trans>Fee</Trans>,
        type: 'number',
      },
    ],
  },
  {
    command: 'unsubscribe',
    label: <Trans>Unsubscribe</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.ID,
        label: <Trans>Store Id</Trans>,
        type: 'string',
      },
    ],
  },
  {
    command: 'verifyOffer',
    label: <Trans>Verify Offer</Trans>,
    service: ServiceName.DATALAYER,
    params: [
      {
        name: WalletConnectCommandParamName.OFFER,
        label: <Trans>Offer</Trans>,
        type: 'string',
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
  // {
  //   command: 'didCreateAttest',
  //   label: <Trans>Create DID Attest</Trans>,
  //   service: ServiceName.WALLET,
  //   params: [
  //     {
  //       name: WalletConnectCommandParamName.WALLET_ID,
  //       type: 'number',
  //       label: <Trans>Wallet Id</Trans>,
  //     },
  //     {
  //       name: WalletConnectCommandParamName.COIN_NAME,
  //       type: 'string',
  //       label: <Trans>Coin Name</Trans>,
  //     },
  //     {
  //       name: WalletConnectCommandParamName.PUBKEY,
  //       type: 'string',
  //       label: <Trans>Public Key</Trans>,
  //     },
  //     {
  //       name: WalletConnectCommandParamName.PUZHASH,
  //       type: 'string',
  //       label: <Trans>Puzzle Hash</Trans>,
  //     },
  //   ],
  // },
  // {
  //   command: 'didCreateBackupFile',
  //   label: <Trans>Create DID Backup File</Trans>,
  //   service: ServiceName.WALLET,
  //   params: [
  //     {
  //       name: WalletConnectCommandParamName.WALLET_ID,
  //       type: 'number',
  //       label: <Trans>Wallet Id</Trans>,
  //     },
  //   ],
  // },
  {
    command: 'findLostDID',
    label: <Trans>Find Lost DID</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.COIN_ID,
        type: 'string',
        label: <Trans>Coin Id</Trans>,
      },
      {
        name: WalletConnectCommandParamName.RECOVERY_LIST_HASH,
        type: 'string',
        label: <Trans>Recovery List Hash</Trans>,
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.NUM_VERIFICATION,
        type: 'number',
        label: <Trans>Required Number of DIDs for Verification</Trans>,
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.METADATA,
        type: 'string',
        label: <Trans>DID Metadata</Trans>,
        isOptional: true,
      },
    ],
  },
  {
    command: 'getDIDCurrentCoinInfo',
    label: <Trans>Get DID Current Coin Info</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
      },
    ],
  },
  {
    command: 'getDID',
    label: <Trans>Get DID</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
      },
    ],
  },
  {
    command: 'getDIDInfo',
    label: <Trans>Get DID Info</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.COIN_ID,
        type: 'string',
        label: <Trans>Coin Id</Trans>,
      },
    ],
  },
  {
    command: 'getDIDInformationNeededForRecovery',
    label: <Trans>Get Information Needed For DID Recovery</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
      },
    ],
  },
  {
    command: 'getDIDMetadata',
    label: <Trans>Get DID Metadata</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
      },
    ],
  },
  {
    command: 'getDIDPubkey',
    label: <Trans>Get DID Public Key</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
      },
    ],
  },
  {
    command: 'getDIDRecoveryList',
    label: <Trans>Get DID Recovery List</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
      },
    ],
  },
  // {
  //   command: 'didMessageSpend',
  //   label: <Trans>DID Message Spend</Trans>,
  //   service: ServiceName.WALLET,
  //   params: [
  //     {
  //       name: WalletConnectCommandParamName.WALLET_ID,
  //       type: 'number',
  //       label: <Trans>Wallet Id</Trans>,
  //     },
  //     {
  //       name: WalletConnectCommandParamName.COIN_ANNOUNCEMENTS,
  //       type: 'object',
  //       label: <Trans>Coin Announcements</Trans>,
  //       isOptional: true,
  //     },
  //     {
  //       name: WalletConnectCommandParamName.PUZZLE_ANNOUNCEMENTS,
  //       type: 'object',
  //       label: <Trans>Puzzle Announcements</Trans>,
  //       isOptional: true,
  //     },
  //   ],
  // },
  // {
  //   command: 'didRecoverySpend',
  //   label: <Trans>DID Recovery Spend</Trans>,
  //   service: ServiceName.WALLET,
  //   params: [
  //     {
  //       name: WalletConnectCommandParamName.WALLET_ID,
  //       type: 'number',
  //       label: <Trans>Wallet Id</Trans>,
  //     },
  //     {
  //       name: WalletConnectCommandParamName.ATTEST_DATA,
  //       type: 'object',
  //       label: <Trans>Attest Data</Trans>,
  //     },
  //     {
  //       name: WalletConnectCommandParamName.PUBKEY,
  //       type: 'string',
  //       label: <Trans>DID Public Key</Trans>,
  //       isOptional: true,
  //     },
  //     {
  //       name: WalletConnectCommandParamName.PUZHASH,
  //       type: 'string',
  //       label: <Trans>Puzzle Hash</Trans>,
  //       isOptional: true,
  //     },
  //     {
  //       name: WalletConnectCommandParamName.FEE,
  //       type: 'BigNumber',
  //       label: <Trans>Fee</Trans>,
  //       displayComponent: (value) => <MojoToChia value={value} />,
  //       isOptional: true,
  //     },
  //   ],
  // },
  {
    command: 'transferDID',
    label: <Trans>Transfer DID</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
      },
      {
        name: WalletConnectCommandParamName.INNER_ADDRESS,
        type: 'string',
        label: <Trans>Inner Address</Trans>,
      },
      {
        name: WalletConnectCommandParamName.FEE,
        type: 'BigNumber',
        label: <Trans>Fee</Trans>,
        displayComponent: (value) => <MojoToChia value={value} />,
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.WITH_RECOVERY_INFO,
        type: 'boolean',
        label: <Trans>With Recovery Info</Trans>,
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.REUSE_PUZHASH,
        type: 'boolean',
        label: <Trans>Reuse Puzzle Hash</Trans>,
        isOptional: true,
      },
    ],
  },
  {
    command: 'updateDIDMetadata',
    label: <Trans>Update DID Metadata</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
      },
      {
        name: WalletConnectCommandParamName.METADATA,
        type: 'object',
        label: <Trans>DID Metadata</Trans>,
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.FEE,
        type: 'BigNumber',
        label: <Trans>Fee</Trans>,
        displayComponent: (value) => <MojoToChia value={value} />,
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.REUSE_PUZHASH,
        type: 'boolean',
        label: <Trans>Reuse Puzzle Hash</Trans>,
        isOptional: true,
      },
    ],
  },
  {
    command: 'updateDIDRecoveryIds',
    label: <Trans>Update DID Recovery Ids</Trans>,
    service: ServiceName.WALLET,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
      },
      {
        name: WalletConnectCommandParamName.NEW_LIST,
        type: 'object',
        label: <Trans>New Recovery DID List</Trans>,
      },
      {
        name: WalletConnectCommandParamName.NUM_VERIFICATIONS_REQUIRED,
        type: 'number',
        label: <Trans>Number Of DIDs Required For Recovery</Trans>,
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.FEE,
        type: 'BigNumber',
        label: <Trans>Fee</Trans>,
        displayComponent: (value) => <MojoToChia value={value} />,
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.REUSE_PUZHASH,
        type: 'boolean',
        label: <Trans>Reuse Puzzle Hash</Trans>,
        isOptional: true,
      },
    ],
  },
  {
    command: 'getDIDName',
    label: <Trans>Get DID Name</Trans>,
    service: ServiceName.WALLET,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.WALLET_ID,
        type: 'number',
        label: <Trans>Wallet Id</Trans>,
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
        isOptional: true,
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
        isOptional: true,
      },
      {
        name: WalletConnectCommandParamName.REUSE_PUZHASH,
        type: 'boolean',
        label: <Trans>Reuse Puzzle Hash</Trans>,
        isOptional: true,
      },
    ],
  },
  {
    command: 'addVCProofs',
    label: <Trans>Add Proofs</Trans>,
    service: ServiceName.WALLET,
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
    params: [
      {
        name: WalletConnectCommandParamName.VC_PARENT_ID,
        type: 'string',
        label: <Trans>Parent Coin Info</Trans>,
      },
      {
        name: WalletConnectCommandParamName.FEE,
        type: 'number',
        label: <Trans>Fee</Trans>,
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
  {
    command: 'getWalletAddresses',
    label: <Trans>Get wallet addresses for one or more wallet keys</Trans>,
    service: ServiceName.DAEMON,
    bypassConfirm: true,
    params: [
      {
        name: WalletConnectCommandParamName.FINGERPRINTS,
        type: 'object', // number array
        label: <Trans>Fingerprints</Trans>,
        isOptional: true,
        defaultValue: undefined,
      },
      {
        name: WalletConnectCommandParamName.INDEX,
        type: 'number',
        label: <Trans>Index</Trans>,
        isOptional: true,
        defaultValue: undefined,
      },
      {
        name: WalletConnectCommandParamName.COUNT,
        type: 'number',
        label: <Trans>Count</Trans>,
        isOptional: true,
        defaultValue: undefined,
      },
      {
        name: WalletConnectCommandParamName.NON_OBSERVER_DERIVATION,
        type: 'boolean',
        label: <Trans>Non Observer Derivation</Trans>,
        isOptional: true,
        defaultValue: undefined,
      },
    ],
  },
  {
    command: 'getPublicKey',
    label: <Trans>Get public key</Trans>,
    description: <Trans>Requests a master public key from your wallet</Trans>,
    service: ServiceName.DAEMON,
    params: [
      {
        name: WalletConnectCommandParamName.FINGERPRINT,
        type: 'number',
        label: <Trans>Fingerprint</Trans>,
      },
    ],
  },
];

export default walletConnectCommands;

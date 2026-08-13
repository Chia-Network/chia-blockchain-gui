import type { PermissionsNotificationPayload } from '../../@types/PermissionsService';
import { i18n } from '../../config/locales';
import { sendCommand } from '../api/sendCommand';
import { addDappBypassPermissions } from '../utils/addDappBypassPermissions';
import type { DispatchPairRequestContext } from '../utils/dispatchPairRequest';
import { normalizeHex } from '../utils/normalizeHex';
import { parseMojos } from '../utils/parseMojos';
import { showNotification } from '../utils/showNotification';

export type ParamSchema = {
  name: string;
  label: () => string;
  isOptional?: boolean;
  hide?: boolean; // hidden from the confirm dialog - still showed under json details
  type: 'string' | 'number' | 'bool' | 'bigint' | 'json';
  humanize?: 'mojo-to-xch' | 'mojo-to-cat';
};

type CommandBase = {
  title: () => string;
  message: () => string;
  confirmLabel: () => string;
  params: ParamSchema[];
  destructive?: boolean;
};

export type DappCommandDefinition = Partial<CommandBase> & {
  command: string;
  requiresSync?: boolean;
  preserveNestedDataKeys?: boolean; // if true nested JSON keys are treated as data, not field names

  defaults?: Record<string, unknown>;
  handler?: (params: Record<string, unknown>, context: DappCommandHandlerContext) => Promise<Record<string, unknown>>; // routes to `dappHandlers[handlerKey]` instead of the daemon.
  transform?: (data: Record<string, unknown>) => unknown;

  allowConfirmationBypass?: boolean;
};

export type DappCommandHandlerContext = DispatchPairRequestContext & {
  sendNotification: (notification: PermissionsNotificationPayload) => void;
  canBypassCommand: (command: string) => boolean;
};

// all optional fields will be overridden with parent command schema in DappCommands
export type DappCommandSchema = CommandBase &
  DappCommandDefinition & {
    commandId: string;
  };

export type CommandSchema = CommandBase & {
  dapp?: DappCommandDefinition[];
};

function getOffer(params: Record<string, unknown>, fileContents: boolean) {
  return sendCommand('get_offer', 'chia_wallet', {
    trade_id: params.offer_id,
    file_contents: fileContents,
  });
}

export const Commands: Record<string, CommandSchema> = {
  'chia_app.show_notification': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Notification' }),
    message: () => i18n._(/* i18n */ { id: 'This app wants to show you a notification.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Show' }),
    params: [
      {
        name: 'type',
        label: () => i18n._(/* i18n */ { id: 'Type' }),
        type: 'string',
      },
      {
        name: 'message',
        label: () => i18n._(/* i18n */ { id: 'Message' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'url',
        label: () => i18n._(/* i18n */ { id: 'URL' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'offer_data',
        label: () => i18n._(/* i18n */ { id: 'Offer Data' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'all_fingerprints',
        label: () => i18n._(/* i18n */ { id: 'Is notification visible to the paired fingerprint' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_showNotification',
        title: () => i18n._(/* i18n */ { id: 'Show Notification' }),
        message: () => i18n._(/* i18n */ { id: 'Show notification with offer or general announcement' }),
        handler: showNotification,
      },
    ],
  },

  'chia_app.request_permissions': {
    title: () => i18n._(/* i18n */ { id: 'Request Permissions' }),
    message: () => i18n._(/* i18n */ { id: 'This app wants to always allow selected commands without confirmation.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Allow' }),
    params: [
      {
        name: 'commands',
        label: () => i18n._(/* i18n */ { id: 'Commands' }),
        type: 'json',
      },
    ],
    dapp: [
      {
        command: 'chia_requestPermissions',
        title: () => i18n._(/* i18n */ { id: 'Request Permissions' }),
        message: () => i18n._(/* i18n */ { id: 'Always allow selected commands without asking for confirmation' }),
        handler: async (params, context) =>
          addDappBypassPermissions(context.pair, params, {
            canBypassCommand: context.canBypassCommand,
          }),
      },
    ],
  },

  'chia_wallet.send_transaction': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Send Transaction' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this blockchain transaction.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      {
        name: 'amount',
        label: () => i18n._(/* i18n */ { id: 'Amount' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
      },
      { name: 'address', label: () => i18n._(/* i18n */ { id: 'Address' }), type: 'string' },
      {
        name: 'wallet_id',
        label: () => i18n._(/* i18n */ { id: 'Wallet Id' }),
        type: 'number',
        hide: true,
      },
      {
        name: 'memos',
        label: () => i18n._(/* i18n */ { id: 'Memos' }),
        type: 'json',
        isOptional: true,
        hide: true,
      },
      {
        name: 'puzzle_decorator',
        label: () => i18n._(/* i18n */ { id: 'Puzzle Decorator' }),
        type: 'json',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_sendTransaction',
        title: () => i18n._(/* i18n */ { id: 'Send Transaction' }),
        requiresSync: true,
        defaults: { wallet_id: 1 },
      },
    ],
  },

  'chia_wallet.cat_spend': {
    title: () => i18n._(/* i18n */ { id: 'Confirm CAT Spend' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this CAT spend.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' },
      { name: 'address', label: () => i18n._(/* i18n */ { id: 'Address' }), type: 'string' },
      {
        name: 'amount',
        label: () => i18n._(/* i18n */ { id: 'Amount' }),
        type: 'bigint',
        humanize: 'mojo-to-cat',
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
      },
      {
        name: 'memos',
        label: () => i18n._(/* i18n */ { id: 'Memos' }),
        type: 'json',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_spendCAT',
        title: () => i18n._(/* i18n */ { id: 'Spend CAT' }),
        requiresSync: true,
      },
    ],
  },

  'chia_wallet.nft_transfer_nft': {
    title: () => i18n._(/* i18n */ { id: 'Confirm NFT Transfer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this NFT transfer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Transfer' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' },
      {
        name: 'nft_coin_ids',
        label: () => i18n._(/* i18n */ { id: 'NFT Coin Ids' }),
        type: 'json',
      },
      {
        name: 'target_address',
        label: () => i18n._(/* i18n */ { id: 'Target Address' }),
        type: 'string',
      },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'bigint', humanize: 'mojo-to-xch' },
    ],
    dapp: [
      {
        command: 'chia_transferNFT',
        title: () => i18n._(/* i18n */ { id: 'Transfer NFT' }),
      },
    ],
  },

  'chia_wallet.nft_transfer_bulk': {
    title: () => i18n._(/* i18n */ { id: 'Confirm NFT Transfer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this NFT transfer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Transfer' }),
    params: [
      { name: 'nft_coin_list', label: () => i18n._(/* i18n */ { id: 'NFT Coin List' }), type: 'json' },
      { name: 'target_address', label: () => i18n._(/* i18n */ { id: 'Target Address' }), type: 'string' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'bigint', humanize: 'mojo-to-xch' },
    ],
  },

  'chia_wallet.cancel_offer': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Cancel Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this offer cancellation.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    destructive: true,
    params: [
      { name: 'trade_id', label: () => i18n._(/* i18n */ { id: 'Trade Id' }), type: 'string' },
      { name: 'secure', label: () => i18n._(/* i18n */ { id: 'Secure' }), type: 'bool' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'bigint', humanize: 'mojo-to-xch' },
    ],
    dapp: [
      {
        command: 'chia_cancelOffer',
        title: () => i18n._(/* i18n */ { id: 'Cancel Offer' }),
        defaults: {
          secure: true,
        },
        // override list of params to hide secure
        params: [
          { name: 'trade_id', label: () => i18n._(/* i18n */ { id: 'Trade Id' }), type: 'string' },
          { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'bigint', humanize: 'mojo-to-xch' },
        ],
      },
    ],
  },

  // TODO verify last 3 params
  'chia_wallet.create_offer_for_ids': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Create Offer for Ids' }),
    message: () =>
      i18n._(
        /* i18n */ {
          id: 'Please carefully review and confirm this offer creation. When creating an offer, any assets that are being offered will be locked and unavailable until the offer is accepted or cancelled, resulting in your spendable balance changing.',
        },
      ),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      {
        name: 'offer',
        label: () => i18n._(/* i18n */ { id: 'Wallet Ids and Amounts' }),
        type: 'json',
      },
      { name: 'driver_dict', label: () => i18n._(/* i18n */ { id: 'Driver Dict' }), type: 'json' },
      {
        name: 'validate_only',
        label: () => i18n._(/* i18n */ { id: 'Validate Only' }),
        type: 'bool',
        isOptional: true,
      },
      {
        name: 'disable_json_formatting',
        label: () => i18n._(/* i18n */ { id: 'Disable JSON Formatting' }),
        type: 'bool',
        isOptional: true,
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
      // TODO verify rest if needed for DAPP, if not use for dapp separate params
      {
        name: 'offer_only',
        label: () => i18n._(/* i18n */ { id: 'Omit transactions data' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'extra_conditions',
        label: () => i18n._(/* i18n */ { id: 'Extra Conditions' }),
        type: 'json',
        isOptional: true,
      },
      {
        name: 'coin_ids',
        label: () => i18n._(/* i18n */ { id: 'Coin Ids' }),
        type: 'json',
        isOptional: true,
      },
      {
        name: 'allow_unsynced',
        label: () => i18n._(/* i18n */ { id: 'Allow Unsynced' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_createOfferForIds',
        preserveNestedDataKeys: true,
        title: () => i18n._(/* i18n */ { id: 'Create Offer for Ids' }),
      },
    ],
  },

  'chia_wallet.take_offer': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Take Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this offer acceptance.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Accept' }),
    params: [
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'bigint', humanize: 'mojo-to-xch' },
      { name: 'offer', label: () => i18n._(/* i18n */ { id: 'Offer' }), type: 'string' },
      // TODO verify rest if needed for DAPP, if not use for dapp separate params
      {
        name: 'extra_conditions',
        label: () => i18n._(/* i18n */ { id: 'Extra Conditions' }),
        type: 'json',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_takeOffer',
        title: () => i18n._(/* i18n */ { id: 'Take Offer' }),
      },
    ],
  },

  'chia_wallet.sign_message_by_address': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Sign Message' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to sign this message?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Sign' }),
    params: [
      { name: 'address', label: () => i18n._(/* i18n */ { id: 'Address' }), type: 'string' },
      { name: 'message', label: () => i18n._(/* i18n */ { id: 'Message' }), type: 'string' },
      {
        name: 'is_hex',
        label: () => i18n._(/* i18n */ { id: 'Message Is Hex Encoded String' }),
        type: 'bool',
        isOptional: true,
      },
      {
        name: 'safe_mode',
        label: () => i18n._(/* i18n */ { id: 'Safe Mode' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_signMessageByAddress',
        title: () => i18n._(/* i18n */ { id: 'Sign Message by Address' }),
      },
    ],
  },

  'chia_wallet.sign_message_by_id': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Sign Message' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to sign this message?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Sign' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Id' }), type: 'string' },
      { name: 'message', label: () => i18n._(/* i18n */ { id: 'Message' }), type: 'string' },
      {
        name: 'is_hex',
        label: () => i18n._(/* i18n */ { id: 'Message Is Hex Encoded String' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_signMessageById',
        title: () => i18n._(/* i18n */ { id: 'Sign Message by Id' }),
      },
    ],
  },

  'chia_wallet.nft_set_nft_did': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Move NFT to DID' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to move this NFT to the specified profile?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Move' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' },
      {
        name: 'nft_launcher_id',
        label: () => i18n._(/* i18n */ { id: 'NFT Launcher Id' }),
        type: 'string',
      },
      {
        name: 'nft_coin_ids',
        label: () => i18n._(/* i18n */ { id: 'NFT Coin Ids' }),
        type: 'json',
      },
      { name: 'did', label: () => i18n._(/* i18n */ { id: 'DID' }), type: 'string' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'bigint', humanize: 'mojo-to-xch' },
    ],
    dapp: [
      {
        command: 'chia_setNFTDID',
        title: () => i18n._(/* i18n */ { id: 'Set NFT DID' }),
      },
    ],
  },

  // TODO verify param names in chia-blockchain
  'chia_wallet.nft_set_did_bulk': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Move NFTs to DID' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to move these NFTs to the specified profile?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Move' }),
    params: [
      { name: 'nft_coin_list', label: () => i18n._(/* i18n */ { id: 'NFT Coin List' }), type: 'json' },
      { name: 'did_id', label: () => i18n._(/* i18n */ { id: 'DID' }), type: 'string' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'bigint' },
    ],
  },

  // TODO verify param names in chia-blockchain
  'chia_wallet.set_auto_claim': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Set Auto Claim' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to set auto claim?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Set' }),
    params: [
      { name: 'enabled', label: () => i18n._(/* i18n */ { id: 'Enabled' }), type: 'bool' },
      { name: 'tx_fee', label: () => i18n._(/* i18n */ { id: 'Transaction Fee' }), type: 'bigint' },
      { name: 'min_amount', label: () => i18n._(/* i18n */ { id: 'Min Amount' }), type: 'bigint' },
    ],
  },

  'chia_wallet.create_new_wallet': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Create New Wallet' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to create a new wallet?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      { name: 'name', label: () => i18n._(/* i18n */ { id: 'Name' }), type: 'string', isOptional: true },
      { name: 'wallet_name', label: () => i18n._(/* i18n */ { id: 'Name' }), type: 'string', isOptional: true },
      { name: 'wallet_type', label: () => i18n._(/* i18n */ { id: 'Type' }), type: 'string' },
      { name: 'asset_id', label: () => i18n._(/* i18n */ { id: 'Asset ID' }), type: 'string', isOptional: true },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'bigint', isOptional: true },
    ],
    dapp: [
      {
        command: 'chia_addCATToken',
        title: () => i18n._(/* i18n */ { id: 'Add CAT Token' }),
        params: [
          { name: 'name', label: () => i18n._(/* i18n */ { id: 'Wallet Name' }), type: 'string' },
          { name: 'asset_id', label: () => i18n._(/* i18n */ { id: 'Asset ID' }), type: 'string' },
        ],
        defaults: {
          wallet_type: 'cat_wallet',
          mode: 'existing',
          fee: 0,
        },
      },
      {
        command: 'chia_createNewDIDWallet',
        title: () => i18n._(/* i18n */ { id: 'Confirm Create DID Wallet' }),
        message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm creating this DID wallet.' }),
        confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
        params: [
          { name: 'amount', label: () => i18n._(/* i18n */ { id: 'Amount' }), type: 'bigint', humanize: 'mojo-to-xch' },
          { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'bigint', humanize: 'mojo-to-xch' },
          { name: 'backup_dids', label: () => i18n._(/* i18n */ { id: 'Backup DIDs' }), type: 'json' },
          {
            name: 'num_of_backup_ids_needed',
            label: () => i18n._(/* i18n */ { id: 'Number of Backup Ids Needed' }),
            type: 'number',
          },
        ],
        defaults: {
          wallet_type: 'did_wallet',
          did_type: 'new',
        },
      },
      {
        command: 'chia_createNewRemoteWallet',
        title: () => i18n._(/* i18n */ { id: 'Create new Remote Wallet' }),
        message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm creating this remote wallet.' }),
        params: [
          { name: 'name', label: () => i18n._(/* i18n */ { id: 'Name' }), type: 'string', isOptional: true },
          {
            name: 'allow_unsynced',
            label: () => i18n._(/* i18n */ { id: 'Allow Unsynced' }),
            type: 'bool',
            isOptional: true,
          },
        ],
        defaults: {
          wallet_type: 'remote_wallet',
        },
      },
    ],
  },

  'chia_wallet.delete_key': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Delete Wallet' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to delete this wallet?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Delete' }),
    destructive: true,
    params: [{ name: 'fingerprint', label: () => i18n._(/* i18n */ { id: 'Fingerprint' }), type: 'number' }],
  },

  'chia_harvester.delete_plot': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Delete Plot' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to delete this plot?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Delete' }),
    destructive: true,
    params: [{ name: 'filename', label: () => i18n._(/* i18n */ { id: 'Filename' }), type: 'string' }],
  },

  'chia_harvester.add_plot_directory': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Add Plot Directory' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to add this plot directory?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Add' }),
    params: [{ name: 'dirname', label: () => i18n._(/* i18n */ { id: 'Directory' }), type: 'string' }],
  },

  'chia_harvester.remove_plot_directory': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Remove Plot Directory' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to remove this plot directory?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Remove' }),
    destructive: true,
    params: [{ name: 'dirname', label: () => i18n._(/* i18n */ { id: 'Directory' }), type: 'string' }],
  },

  'chia_full_node.open_connection': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Open Connection' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to open a connection to the specified node?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Connect' }),
    params: [
      { name: 'host', label: () => i18n._(/* i18n */ { id: 'Host' }), type: 'string' },
      { name: 'port', label: () => i18n._(/* i18n */ { id: 'Port' }), type: 'string' },
    ],
  },

  'chia_full_node.close_connection': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Disconnect' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to disconnect from the specified node?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Disconnect' }),
    destructive: true,
    params: [
      {
        name: 'node_id',
        label: () => i18n._(/* i18n */ { id: 'Node ID' }),
        type: 'string',
      },
    ],
  },

  'chia_farmer.close_connection': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Disconnect' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to disconnect from the specified farmer?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Disconnect' }),
    destructive: true,
    params: [
      {
        name: 'node_id',
        label: () => i18n._(/* i18n */ { id: 'Node ID' }),
        type: 'string',
      },
    ],
  },

  'chia_farmer.set_payout_instructions': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Set Payout Instructions' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to set payout instructions?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Set' }),
    params: [
      { name: 'payout_instructions', label: () => i18n._(/* i18n */ { id: 'Payout Instructions' }), type: 'string' },
    ],
  },

  'daemon.stop_plotting': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Stop Plotting' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to stop plotting?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Stop' }),
    destructive: true,
    params: [{ name: 'id', label: () => i18n._(/* i18n */ { id: 'ID' }), type: 'string' }],
  },

  'chia_wallet.log_in': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Log In' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to switch to this wallet key?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Log In' }),
    params: [{ name: 'fingerprint', label: () => i18n._(/* i18n */ { id: 'Fingerprint' }), type: 'number' }],
  },

  'chia_wallet.spend_clawback_coins': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Clawback Spend' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this clawback spend.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'coin_ids', label: () => i18n._(/* i18n */ { id: 'Coin Ids' }), type: 'json' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'bigint', humanize: 'mojo-to-xch' },
    ],
    dapp: [
      {
        command: 'chia_spendClawbackCoins',
        title: () => i18n._(/* i18n */ { id: 'Claw back or claim claw back transaction' }),
        requiresSync: true,
      },
    ],
  },

  'chia_wallet.push_transactions': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Push Transactions' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm pushing this transaction bundle.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Push' }),
    params: [
      {
        name: 'transactions',
        label: () => i18n._(/* i18n */ { id: 'Transactions' }),
        type: 'json',
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
      {
        name: 'push',
        label: () => i18n._(/* i18n */ { id: 'Push' }),
        type: 'bool',
        isOptional: true,
      },
      {
        name: 'sign',
        label: () => i18n._(/* i18n */ { id: 'Sign' }),
        type: 'bool',
        isOptional: true,
      },
      // TODO verify param names in chia-blockchain
      {
        name: 'allow_unsynced',
        label: () => i18n._(/* i18n */ { id: 'Allow Unsynced' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_pushTransactions',
        title: () => i18n._(/* i18n */ { id: 'Push Transactions' }),
        message: () => i18n._(/* i18n */ { id: 'Push a list of transactions to the blockchain via the wallet' }),
      },
    ],
  },

  'chia_full_node.push_tx': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Push Transaction' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm pushing this transaction.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Push' }),
    params: [{ name: 'spend_bundle', label: () => i18n._(/* i18n */ { id: 'Spend Bundle' }), type: 'json' }],
    dapp: [
      {
        command: 'chia_pushTx',
        title: () => i18n._(/* i18n */ { id: 'Push Transaction' }),
        message: () => i18n._(/* i18n */ { id: 'Push a spend bundle (transaction) to the blockchain' }),
      },
    ],
  },

  'chia_wallet.nft_mint_nft': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Mint NFT' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this NFT mint.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Mint' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' },
      {
        name: 'royalty_address',
        label: () => i18n._(/* i18n */ { id: 'Royalty Address' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'royalty_percentage',
        label: () => i18n._(/* i18n */ { id: 'Royalty Percentage' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'target_address',
        label: () => i18n._(/* i18n */ { id: 'Target Address' }),
        type: 'string',
        isOptional: true,
      },
      { name: 'uris', label: () => i18n._(/* i18n */ { id: 'Uris' }), type: 'json' },
      { name: 'hash', label: () => i18n._(/* i18n */ { id: 'Hash' }), type: 'string' },
      { name: 'meta_uris', label: () => i18n._(/* i18n */ { id: 'Meta Uris' }), type: 'json' },
      {
        name: 'meta_hash',
        label: () => i18n._(/* i18n */ { id: 'Meta Hash' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'license_uris',
        label: () => i18n._(/* i18n */ { id: 'License Uris' }),
        type: 'json',
      },
      {
        name: 'license_hash',
        label: () => i18n._(/* i18n */ { id: 'License Hash' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'edition_number',
        label: () => i18n._(/* i18n */ { id: 'Edition Number' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'edition_total',
        label: () => i18n._(/* i18n */ { id: 'Edition Total' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'did_id',
        label: () => i18n._(/* i18n */ { id: 'DID Id' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        isOptional: true,
        humanize: 'mojo-to-xch',
      },
    ],
    dapp: [
      {
        command: 'chia_mintNFT',
        title: () => i18n._(/* i18n */ { id: 'Mint NFT' }),
      },
    ],
  },

  'chia_wallet.nft_mint_bulk': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Bulk Mint NFTs' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this bulk NFT mint.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Mint' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' },
      {
        name: 'metadata_list',
        label: () => i18n._(/* i18n */ { id: 'Metadata List' }),
        type: 'json',
      },
      {
        name: 'royalty_percentage',
        label: () => i18n._(/* i18n */ { id: 'Royalty Percentage' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'royalty_address',
        label: () => i18n._(/* i18n */ { id: 'Royalty Address' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'target_list',
        label: () => i18n._(/* i18n */ { id: 'Target List' }),
        type: 'json',
        isOptional: true,
      },
      {
        name: 'mint_number_start',
        label: () => i18n._(/* i18n */ { id: 'Mint Start Number' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'mint_total',
        label: () => i18n._(/* i18n */ { id: 'Mint Total' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'xch_coins',
        label: () => i18n._(/* i18n */ { id: 'XCH Coins' }),
        type: 'json',
        isOptional: true,
      },
      {
        name: 'xch_change_target',
        label: () => i18n._(/* i18n */ { id: 'XCH Change Target' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'new_innerpuzhash',
        label: () => i18n._(/* i18n */ { id: 'New Inner Puzzle Hash' }),
        type: 'json',
        isOptional: true,
      },
      {
        name: 'new_p2_puzhash',
        label: () => i18n._(/* i18n */ { id: 'New P2 Puzzle Hash' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'did_coin',
        label: () => i18n._(/* i18n */ { id: 'DID Coin Dictionary' }),
        type: 'json',
        isOptional: true,
      },
      {
        name: 'did_lineage_parent',
        label: () => i18n._(/* i18n */ { id: 'DID Lineage Parent' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'mint_from_did',
        label: () => i18n._(/* i18n */ { id: 'Mint From DID' }),
        type: 'bool',
        isOptional: true,
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
      {
        name: 'reuse_puzhash',
        label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_mintBulk',
        title: () => i18n._(/* i18n */ { id: 'Mint Bulk' }),
        message: () => i18n._(/* i18n */ { id: 'Create a spend bundle to mint multiple NFTs' }),
      },
    ],
  },

  'chia_wallet.did_find_lost_did': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Find Lost DID' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to recover this DID?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Recover' }),
    params: [
      { name: 'coin_id', label: () => i18n._(/* i18n */ { id: 'Coin Id' }), type: 'string' },
      {
        name: 'recovery_list_hash',
        label: () => i18n._(/* i18n */ { id: 'Recovery List Hash' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'num_verification',
        label: () => i18n._(/* i18n */ { id: 'Required Number of DIDs for Verification' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'metadata',
        label: () => i18n._(/* i18n */ { id: 'DID Metadata' }),
        type: 'string',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_findLostDID',
        title: () => i18n._(/* i18n */ { id: 'Find Lost DID' }),
      },
    ],
  },

  'chia_wallet.did_update_metadata': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Update DID Metadata' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this DID metadata update.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Update' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' },
      {
        name: 'metadata',
        label: () => i18n._(/* i18n */ { id: 'DID Metadata' }),
        type: 'json',
        isOptional: true,
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
      {
        name: 'reuse_puzhash',
        label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_updateDIDMetadata',
        preserveNestedDataKeys: true,
        title: () => i18n._(/* i18n */ { id: 'Update DID Metadata' }),
      },
    ],
  },

  'chia_wallet.did_transfer_did': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Transfer DID' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this DID transfer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Transfer' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' },
      { name: 'inner_address', label: () => i18n._(/* i18n */ { id: 'Inner Address' }), type: 'string' },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
      {
        name: 'with_recovery_info',
        label: () => i18n._(/* i18n */ { id: 'With Recovery Info' }),
        type: 'bool',
        isOptional: true,
      },
      {
        name: 'reuse_puzhash',
        label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_transferDID',
        title: () => i18n._(/* i18n */ { id: 'Transfer DID' }),
      },
    ],
  },

  'chia_wallet.did_set_wallet_name': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Set DID Name' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm renaming this DID wallet.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Set' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' },
      { name: 'name', label: () => i18n._(/* i18n */ { id: 'Name' }), type: 'string' },
    ],
    dapp: [
      {
        command: 'chia_setDIDName',
        title: () => i18n._(/* i18n */ { id: 'Set DID Name' }),
      },
    ],
  },

  'chia_wallet.vc_spend': {
    title: () => i18n._(/* i18n */ { id: 'Confirm VC Spend' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this verifiable credential spend.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'vc_id', label: () => i18n._(/* i18n */ { id: 'Launcher Id' }), type: 'string' },
      {
        name: 'new_puzhash',
        label: () => i18n._(/* i18n */ { id: 'New Puzzle Hash' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'new_proof_hash',
        label: () => i18n._(/* i18n */ { id: 'New Proof Hash' }),
        type: 'string',
      },
      {
        name: 'provider_inner_puzhash',
        label: () => i18n._(/* i18n */ { id: 'Provider Inner Puzzle Hash' }),
        type: 'string',
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
      {
        name: 'reuse_puzhash',
        label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_spendVC',
        title: () => i18n._(/* i18n */ { id: 'Add Proofs To Verifiable Credential' }),
      },
    ],
  },

  'chia_wallet.vc_add_proofs': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Add VC Proofs' }),
    message: () =>
      i18n._(/* i18n */ { id: 'Please carefully review and confirm adding proofs to this verifiable credential.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Add' }),
    params: [
      { name: 'proofs', label: () => i18n._(/* i18n */ { id: 'Proofs Object (Key Value Pairs)' }), type: 'json' },
    ],
    dapp: [
      {
        command: 'chia_addVCProofs',
        preserveNestedDataKeys: true,
        title: () => i18n._(/* i18n */ { id: 'Add Proofs' }),
      },
    ],
  },

  'chia_wallet.vc_revoke': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Revoke VC' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to revoke this verifiable credential?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Revoke' }),
    destructive: true,
    params: [
      {
        name: 'vc_parent_id',
        label: () => i18n._(/* i18n */ { id: 'Parent Coin Id' }),
        type: 'string',
      },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'bigint', humanize: 'mojo-to-xch' },
    ],
    dapp: [
      {
        command: 'chia_revokeVC',
        title: () => i18n._(/* i18n */ { id: 'Revoke Verifiable Credential' }),
      },
    ],
  },

  'chia_data_layer.create_data_store': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Create DataStore' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm creating this data store.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
      {
        name: 'verbose',
        label: () => i18n._(/* i18n */ { id: 'Verbose' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_createDataStore',
        title: () => i18n._(/* i18n */ { id: 'Create DataStore' }),
      },
    ],
  },

  'chia_data_layer.batch_update': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Update' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this data store update.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Update' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' },
      { name: 'changelist', label: () => i18n._(/* i18n */ { id: 'Changelist' }), type: 'json' },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
      {
        name: 'submit_on_chain',
        label: () => i18n._(/* i18n */ { id: 'Submit On Chain' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_batchUpdate',
        title: () => i18n._(/* i18n */ { id: 'Batch Update' }),
      },
    ],
  },

  'chia_data_layer.insert': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Insert' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this data store insert.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Insert' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' },
      { name: 'key', label: () => i18n._(/* i18n */ { id: 'Key' }), type: 'string' },
      { name: 'value', label: () => i18n._(/* i18n */ { id: 'Value' }), type: 'string' },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_insert',
        title: () => i18n._(/* i18n */ { id: 'Insert' }),
      },
    ],
  },

  'chia_data_layer.delete_key': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Delete Key' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to delete this key from the data store?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Delete' }),
    destructive: true,
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' },
      { name: 'key', label: () => i18n._(/* i18n */ { id: 'Key' }), type: 'string' },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_deleteKey',
        title: () => i18n._(/* i18n */ { id: 'Delete Key' }),
      },
    ],
  },

  'chia_data_layer.add_mirror': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Add Mirror' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm adding this mirror.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Add' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' },
      { name: 'urls', label: () => i18n._(/* i18n */ { id: 'URLs' }), type: 'json' },
      { name: 'amount', label: () => i18n._(/* i18n */ { id: 'Amount' }), type: 'bigint' },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_addMirror',
        title: () => i18n._(/* i18n */ { id: 'Add Mirror' }),
      },
    ],
  },

  'chia_data_layer.delete_mirror': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Delete Mirror' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to delete this mirror?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Delete' }),
    destructive: true,
    params: [
      { name: 'coin_id', label: () => i18n._(/* i18n */ { id: 'Coin Id' }), type: 'string' },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_deleteMirror',
        title: () => i18n._(/* i18n */ { id: 'Delete Mirror' }),
      },
    ],
  },

  'chia_data_layer.subscribe': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Subscribe' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this subscription.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Subscribe' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' },
      { name: 'urls', label: () => i18n._(/* i18n */ { id: 'URLs' }), type: 'json' },
    ],
    dapp: [
      {
        command: 'chia_subscribe',
        title: () => i18n._(/* i18n */ { id: 'Subscribe' }),
      },
    ],
  },

  'chia_data_layer.unsubscribe': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Unsubscribe' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this unsubscribe.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Unsubscribe' }),
    destructive: true,
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' },
      {
        name: 'retain',
        label: () => i18n._(/* i18n */ { id: 'Retain' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_unsubscribe',
        title: () => i18n._(/* i18n */ { id: 'Unsubscribe' }),
      },
    ],
  },

  'chia_data_layer.remove_subscriptions': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Remove Subscriptions' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to remove these subscription URLs?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Remove' }),
    destructive: true,
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' },
      { name: 'urls', label: () => i18n._(/* i18n */ { id: 'URLs' }), type: 'json' },
    ],
    dapp: [
      {
        command: 'chia_removeSubscriptions',
        title: () => i18n._(/* i18n */ { id: 'Remove Subscriptions' }),
      },
    ],
  },

  'chia_data_layer.add_missing_files': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Add Missing Files' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm syncing missing files.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Sync' }),
    params: [
      {
        name: 'ids',
        label: () => i18n._(/* i18n */ { id: 'Store Ids' }),
        type: 'json',
        isOptional: true,
      },
      {
        name: 'overwrite',
        label: () => i18n._(/* i18n */ { id: 'Overwrite' }),
        type: 'bool',
        isOptional: true,
      },
      {
        name: 'foldername',
        label: () => i18n._(/* i18n */ { id: 'Folder Name' }),
        type: 'string',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_addMissingFiles',
        title: () => i18n._(/* i18n */ { id: 'Add Missing Files' }),
      },
    ],
  },

  'chia_data_layer.check_plugins': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Check Plugins' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this plugin check.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Check' }),
    params: [],
    dapp: [
      {
        command: 'chia_checkPlugins',
        title: () => i18n._(/* i18n */ { id: 'Check Plugins' }),
      },
    ],
  },

  'chia_data_layer.clear_pending_roots': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Clear Pending Roots' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to clear pending roots for this store?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Clear' }),
    destructive: true,
    params: [{ name: 'store_id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_clearPendingRoots',
        title: () => i18n._(/* i18n */ { id: 'Clear Pending Roots' }),
      },
    ],
  },

  'chia_data_layer.get_ancestors': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Get Ancestors' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this query.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Query' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' },
      { name: 'hash', label: () => i18n._(/* i18n */ { id: 'Hash' }), type: 'string' },
    ],
    dapp: [
      {
        command: 'chia_getAncestors',
        title: () => i18n._(/* i18n */ { id: 'Get Ancestors' }),
      },
    ],
  },

  'chia_data_layer.subscriptions': {
    title: () => i18n._(/* i18n */ { id: 'Confirm List Subscriptions' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this query.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Query' }),
    params: [],
    dapp: [
      {
        command: 'chia_subscriptions',
        title: () => i18n._(/* i18n */ { id: 'Subscriptions' }),
      },
    ],
  },

  'chia_data_layer.make_offer': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Make DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this DataLayer offer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      { name: 'maker', label: () => i18n._(/* i18n */ { id: 'Maker' }), type: 'json' },
      { name: 'taker', label: () => i18n._(/* i18n */ { id: 'Taker' }), type: 'json' },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_makeDataLayerOffer',
        title: () => i18n._(/* i18n */ { id: 'Make DataLayer Offer' }),
      },
    ],
  },

  'chia_data_layer.take_offer': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Take DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm taking this DataLayer offer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Accept' }),
    params: [
      { name: 'offer', label: () => i18n._(/* i18n */ { id: 'Offer' }), type: 'json' },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_takeDataLayerOffer',
        title: () => i18n._(/* i18n */ { id: 'Take DataLayer Offer' }),
      },
    ],
  },

  'chia_data_layer.cancel_offer': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Cancel DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm cancelling this DataLayer offer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Cancel' }),
    destructive: true,
    params: [
      // verify trade_id name
      { name: 'trade_id', label: () => i18n._(/* i18n */ { id: 'Trade Id' }), type: 'string' },
      { name: 'secure', label: () => i18n._(/* i18n */ { id: 'Secure' }), type: 'bool' },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_cancelDataLayerOffer',
        title: () => i18n._(/* i18n */ { id: 'Cancel DataLayer Offer' }),
        defaults: {
          secure: true,
        },
        params: [
          // verify trade_id name
          { name: 'trade_id', label: () => i18n._(/* i18n */ { id: 'Trade Id' }), type: 'string' },
          {
            name: 'fee',
            label: () => i18n._(/* i18n */ { id: 'Fee' }),
            type: 'bigint',
            humanize: 'mojo-to-xch',
            isOptional: true,
          },
        ],
      },
    ],
  },

  'chia_data_layer.verify_offer': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Verify DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this offer verification.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Verify' }),
    params: [
      { name: 'offer', label: () => i18n._(/* i18n */ { id: 'Offer' }), type: 'json' },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'bigint',
        humanize: 'mojo-to-xch',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_verifyOffer',
        title: () => i18n._(/* i18n */ { id: 'Verify Offer' }),
      },
    ],
  },

  'chia_wallet.register_remote_coins': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Register Remote Coins' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm registering these remote coins.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Register' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' },
      { name: 'coin_ids', label: () => i18n._(/* i18n */ { id: 'Coin Ids' }), type: 'json' },
    ],
    dapp: [
      {
        command: 'chia_registerRemoteCoins',
        title: () => i18n._(/* i18n */ { id: 'Register Remote Coins' }),
        message: () => i18n._(/* i18n */ { id: 'Registers a list of remote coin IDs with a remote wallet.' }),
      },
    ],
  },

  'daemon.get_public_key': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Get Public Key' }),
    message: () => i18n._(/* i18n */ { id: 'An app is requesting access to a wallet public key.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Share' }),
    params: [{ name: 'fingerprint', label: () => i18n._(/* i18n */ { id: 'Fingerprint' }), type: 'number' }],
    dapp: [
      {
        command: 'chia_getPublicKey',
        title: () => i18n._(/* i18n */ { id: 'Get public key' }),
        message: () => i18n._(/* i18n */ { id: 'Requests a master public key from your wallet' }),
      },
    ],
  },

  'chia_wallet.get_wallets': {
    title: () => i18n._(/* i18n */ { id: 'Get Wallets' }),
    message: () =>
      i18n._(/* i18n */ { id: 'Requests a complete listing of the wallets associated with the current wallet key' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      {
        name: 'include_data',
        label: () => i18n._(/* i18n */ { id: 'Include Wallet Metadata' }),
        type: 'bool',
      },
    ],
    dapp: [
      {
        command: 'chia_getWallets',
        title: () => i18n._(/* i18n */ { id: 'Get Wallets' }),
        message: () =>
          i18n._(
            /* i18n */ { id: 'Requests a complete listing of the wallets associated with the current wallet key' },
          ),
        transform: (data) => data.wallets ?? [],
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.get_transaction': {
    title: () => i18n._(/* i18n */ { id: 'Get Transaction' }),
    message: () => i18n._(/* i18n */ { id: 'Requests details for a specific transaction' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      {
        name: 'transaction_id',
        label: () => i18n._(/* i18n */ { id: 'Transaction Id' }),
        type: 'string',
      },
    ],
    dapp: [
      {
        command: 'chia_getTransaction',
        title: () => i18n._(/* i18n */ { id: 'Get Transaction' }),
        message: () => i18n._(/* i18n */ { id: 'Requests details for a specific transaction' }),
        transform: (data) => data.transaction,
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.get_wallet_balance': {
    title: () => i18n._(/* i18n */ { id: 'Get Wallet Balance' }),
    message: () =>
      i18n._(
        /* i18n */ { id: 'Requests the asset balance for a specific wallet associated with the current wallet key' },
      ),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      {
        name: 'wallet_id',
        label: () => i18n._(/* i18n */ { id: 'Wallet Id' }),
        type: 'number',
        isOptional: true,
        hide: true,
      },
    ],
    dapp: [
      {
        command: 'chia_getWalletBalance',
        title: () => i18n._(/* i18n */ { id: 'Get Wallet Balance' }),
        message: () =>
          i18n._(
            /* i18n */ {
              id: 'Requests the asset balance for a specific wallet associated with the current wallet key',
            },
          ),
        defaults: { wallet_id: 1 },
        transform: (data) => {
          const {
            wallet_balance: walletBalance,
            wallet_balance: {
              confirmed_wallet_balance: confirmedWalletBalance,
              unconfirmed_wallet_balance: unconfirmedWalletBalance,
              asset_id: assetId,
            },
          } = data as {
            wallet_balance: { confirmed_wallet_balance: number; unconfirmed_wallet_balance: number; asset_id: string };
          };

          const confirmedBalance = parseMojos(confirmedWalletBalance);
          const unconfirmedBalance = parseMojos(unconfirmedWalletBalance);
          const pendingBalance = unconfirmedBalance - confirmedBalance;
          const pendingTotalBalance = confirmedBalance + pendingBalance;

          return {
            ...walletBalance,
            ...(assetId && { asset_id: normalizeHex(assetId) }),
            pending_balance: pendingBalance,
            pending_total_balance: pendingTotalBalance,
          };
        },
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.get_wallet_balances': {
    title: () => i18n._(/* i18n */ { id: 'Get Wallet Balances' }),
    message: () =>
      i18n._(
        /* i18n */ { id: 'Requests the asset balances for specific wallets associated with the current wallet key' },
      ),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      {
        name: 'wallet_ids',
        label: () => i18n._(/* i18n */ { id: 'Wallet Ids' }),
        type: 'json',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_getWalletBalances',
        title: () => i18n._(/* i18n */ { id: 'Get Wallet Balances' }),
        message: () =>
          i18n._(
            /* i18n */ {
              id: 'Requests the asset balances for specific wallets associated with the current wallet key',
            },
          ),
        transform: (data) => data.wallet_balances,
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.get_coin_records_by_names': {
    title: () => i18n._(/* i18n */ { id: 'Get Coin Records by Name' }),
    message: () =>
      i18n._(/* i18n */ { id: "Requests the status of a list of coin records from the Wallet's coin store." }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      {
        name: 'names',
        label: () => i18n._(/* i18n */ { id: 'Names (coin ids)' }),
        type: 'json',
      },
      {
        name: 'start_height',
        label: () => i18n._(/* i18n */ { id: 'Start Height' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'end_height',
        label: () => i18n._(/* i18n */ { id: 'End Height' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'include_spent_coins',
        label: () => i18n._(/* i18n */ { id: 'Include Spent Coins' }),
        type: 'bool',
        isOptional: true,
      },
      {
        name: 'allow_unsynced',
        label: () => i18n._(/* i18n */ { id: 'Allow Unsynced' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_getCoinRecordsByNames',
        title: () => i18n._(/* i18n */ { id: 'Get Coin Records by Name' }),
        message: () =>
          i18n._(/* i18n */ { id: "Requests the status of a list of coin records from the Wallet's coin store." }),
        defaults: { include_spent_coins: true },
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.select_coins': {
    title: () => i18n._(/* i18n */ { id: 'Select Coins' }),
    message: () => i18n._(/* i18n */ { id: 'Selects coins to be spent from a specific wallet' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Select' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' },
      { name: 'amount', label: () => i18n._(/* i18n */ { id: 'Amount' }), type: 'bigint' },
      {
        name: 'min_coin_amount',
        label: () => i18n._(/* i18n */ { id: 'Min Coin Amount' }),
        type: 'bigint',
        isOptional: true,
      },
      {
        name: 'max_coin_amount',
        label: () => i18n._(/* i18n */ { id: 'Max Coin Amount' }),
        type: 'bigint',
        isOptional: true,
      },
      {
        name: 'excluded_coin_amounts',
        label: () => i18n._(/* i18n */ { id: 'Excluded Coin Amounts' }),
        type: 'json',
        isOptional: true,
      },
      {
        name: 'excluded_coin_ids',
        label: () => i18n._(/* i18n */ { id: 'Excluded Coin IDs' }),
        type: 'json',
        isOptional: true,
      },
      {
        name: 'allow_unsynced',
        label: () => i18n._(/* i18n */ { id: 'Allow Unsynced' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_selectCoins',
        title: () => i18n._(/* i18n */ { id: 'Select Coins' }),
        message: () => i18n._(/* i18n */ { id: 'Selects coins to be spent from a specific wallet' }),
        defaults: { wallet_id: 1 },
      },
    ],
  },

  'chia_wallet.get_spendable_coins': {
    title: () => i18n._(/* i18n */ { id: 'Get Spendable Coins' }),
    message: () => i18n._(/* i18n */ { id: 'Requests spendable coins for a specific wallet' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' },
      {
        name: 'min_coin_amount',
        label: () => i18n._(/* i18n */ { id: 'Min Coin Amount' }),
        type: 'bigint',
        isOptional: true,
      },
      {
        name: 'max_coin_amount',
        label: () => i18n._(/* i18n */ { id: 'Max Coin Amount' }),
        type: 'bigint',
        isOptional: true,
      },
      {
        name: 'excluded_coin_amounts',
        label: () => i18n._(/* i18n */ { id: 'Excluded Coin Amounts' }),
        type: 'json',
        isOptional: true,
      },
      {
        name: 'excluded_coin_ids',
        label: () => i18n._(/* i18n */ { id: 'Excluded Coin IDs' }),
        type: 'json',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_getSpendableCoins',
        title: () => i18n._(/* i18n */ { id: 'Get Spendable Coins' }),
        message: () => i18n._(/* i18n */ { id: 'Requests spendable coins for a specific wallet' }),
        requiresSync: true,
        defaults: { wallet_id: 1 },
      },
    ],
  },

  'chia_wallet.verify_signature': {
    title: () => i18n._(/* i18n */ { id: 'Verify Signature' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the verification status for a digital signature' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Verify' }),
    params: [
      { name: 'message', label: () => i18n._(/* i18n */ { id: 'Message' }), type: 'string' },
      { name: 'pubkey', label: () => i18n._(/* i18n */ { id: 'Public Key' }), type: 'string' },
      { name: 'signature', label: () => i18n._(/* i18n */ { id: 'Signature' }), type: 'string' },
      {
        name: 'address',
        label: () => i18n._(/* i18n */ { id: 'Address' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'signing_mode',
        label: () => i18n._(/* i18n */ { id: 'Signing Mode' }),
        type: 'string',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_verifySignature',
        title: () => i18n._(/* i18n */ { id: 'Verify Signature' }),
        message: () => i18n._(/* i18n */ { id: 'Requests the verification status for a digital signature' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.get_next_address': {
    title: () => i18n._(/* i18n */ { id: 'Get Next Address' }),
    message: () => i18n._(/* i18n */ { id: 'Requests a new receive address associated with the current wallet key' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      {
        name: 'wallet_id',
        label: () => i18n._(/* i18n */ { id: 'Wallet Id' }),
        type: 'number',
        isOptional: true,
        hide: true,
      },
      {
        name: 'new_address',
        label: () => i18n._(/* i18n */ { id: 'New Address' }),
        type: 'bool',
        isOptional: true,
        hide: true,
      },
    ],
    dapp: [
      {
        command: 'chia_getNextAddress',
        title: () => i18n._(/* i18n */ { id: 'Get Next Address' }),
        message: () =>
          i18n._(/* i18n */ { id: 'Requests a new receive address associated with the current wallet key' }),
        defaults: { wallet_id: 1, new_address: true },
        transform: (data) => data.address,
      },
      {
        command: 'chia_getCurrentAddress',
        title: () => i18n._(/* i18n */ { id: 'Get Current Address' }),
        message: () =>
          i18n._(/* i18n */ { id: 'Requests the current receive address associated with the current wallet key' }),
        defaults: { wallet_id: 1, new_address: false },
        transform: (data) => data.address,
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.get_sync_status': {
    title: () => i18n._(/* i18n */ { id: 'Get Wallet Sync Status' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the syncing status of current wallet' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [],
    dapp: [
      {
        command: 'chia_getSyncStatus',
        title: () => i18n._(/* i18n */ { id: 'Get Wallet Sync Status' }),
        message: () => i18n._(/* i18n */ { id: 'Requests the syncing status of current wallet' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.get_full_node_peer_count': {
    title: () => i18n._(/* i18n */ { id: 'Get Full Node Peer Count' }),
    message: () =>
      i18n._(/* i18n */ { id: 'Requests the number of full node peers currently connected to the wallet' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [],
    dapp: [
      {
        command: 'chia_getFullNodePeerCount',
        title: () => i18n._(/* i18n */ { id: 'Get Full Node Peer Count' }),
        message: () =>
          i18n._(/* i18n */ { id: 'Requests the number of full node peers currently connected to the wallet' }),
        transform: (data) => data.peer_count,
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.get_height_info': {
    title: () => i18n._(/* i18n */ { id: 'Get Height Info' }),
    message: () =>
      i18n._(
        /* i18n */ {
          id: 'Returns wallet height, latest block timestamp, and related fields. Optional usePeakHeight uses the chain tip while syncing.',
        },
      ),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      {
        name: 'use_peak_height',
        label: () => i18n._(/* i18n */ { id: 'Use peak height' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_getHeightInfo',
        title: () => i18n._(/* i18n */ { id: 'Get Height Info' }),
        message: () =>
          i18n._(
            /* i18n */ {
              id: 'Returns wallet height, latest block timestamp, and related fields. Optional usePeakHeight uses the chain tip while syncing.',
            },
          ),
        defaults: { use_peak_height: false },
        transform: (data) => ({
          height: data.height,
          latest_timestamp: data.latest_timestamp,
          is_transaction_block: data.is_transaction_block ?? null,
          prev_transaction_block_height: data.prev_transaction_block_height ?? null,
        }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.get_puzzle_and_solution': {
    title: () => i18n._(/* i18n */ { id: 'Get puzzle and solution' }),
    message: () => i18n._(/* i18n */ { id: 'Fetches the puzzle reveal and solution for a spent coin (hex strings).' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'coin_name', label: () => i18n._(/* i18n */ { id: 'Coin name' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_getPuzzleAndSolution',
        title: () => i18n._(/* i18n */ { id: 'Get puzzle and solution' }),
        message: () =>
          i18n._(/* i18n */ { id: 'Fetches the puzzle reveal and solution for a spent coin (hex strings).' }),
      },
    ],
  },

  'chia_wallet.get_all_offers': {
    title: () => i18n._(/* i18n */ { id: 'Get all Offers' }),
    message: () =>
      i18n._(/* i18n */ { id: 'Requests a complete listing of the offers associated with the current wallet key' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      {
        name: 'start',
        label: () => i18n._(/* i18n */ { id: 'Start' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'end',
        label: () => i18n._(/* i18n */ { id: 'End' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'sort_key',
        label: () => i18n._(/* i18n */ { id: 'Start Key' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'reverse',
        label: () => i18n._(/* i18n */ { id: 'Reverse' }),
        type: 'bool',
        isOptional: true,
      },
      {
        name: 'include_my_offers',
        label: () => i18n._(/* i18n */ { id: 'Include My Offers' }),
        type: 'bool',
        isOptional: true,
      },
      {
        name: 'include_taken_offers',
        label: () => i18n._(/* i18n */ { id: 'Include Taken Offers' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_getAllOffers',
        title: () => i18n._(/* i18n */ { id: 'Get all Offers' }),
        message: () =>
          i18n._(/* i18n */ { id: 'Requests a complete listing of the offers associated with the current wallet key' }),
        // Legacy `getAllOffers` zipped `tradeRecords` with `offers` (when
        // present) under `_offerData` per record. Mirror that.
        transform: (data) => {
          const tradeRecords = (data.trade_records as unknown[]) ?? [];
          const offers = data.offers as unknown[] | undefined;
          if (!offers) {
            return tradeRecords;
          }

          return tradeRecords.map((record, i) => ({
            ...(record as Record<string, unknown>),
            _offer_data: offers[i],
          }));
        },
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.get_offers_count': {
    title: () => i18n._(/* i18n */ { id: 'Get Offers Count' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the number of offers associated with the current wallet key' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [],
    dapp: [
      {
        command: 'chia_getOffersCount',
        title: () => i18n._(/* i18n */ { id: 'Get Offers Count' }),
        message: () =>
          i18n._(/* i18n */ { id: 'Requests the number of offers associated with the current wallet key' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.check_offer_validity': {
    title: () => i18n._(/* i18n */ { id: 'Check Offer Validity' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the validity status of a specific offer' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'offer', label: () => i18n._(/* i18n */ { id: 'Offer Data' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_checkOfferValidity',
        title: () => i18n._(/* i18n */ { id: 'Check Offer Validity' }),
        message: () => i18n._(/* i18n */ { id: 'Requests the validity status of a specific offer' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.get_offer_summary': {
    title: () => i18n._(/* i18n */ { id: 'Get Offer Summary' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the summarized details of a specific offer' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'offer', label: () => i18n._(/* i18n */ { id: 'Offer Data' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_getOfferSummary',
        title: () => i18n._(/* i18n */ { id: 'Get Offer Summary' }),
        message: () => i18n._(/* i18n */ { id: 'Requests the summarized details of a specific offer' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.get_offer_data': {
    title: () => i18n._(/* i18n */ { id: 'Get Offer Data' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the raw offer data for a specific offer' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'offer_id', label: () => i18n._(/* i18n */ { id: 'Offer Id' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_getOfferData',
        title: () => i18n._(/* i18n */ { id: 'Get Offer Data' }),
        message: () => i18n._(/* i18n */ { id: 'Requests the raw offer data for a specific offer' }),
        handler: (params) => getOffer(params, true),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.get_offer_record': {
    title: () => i18n._(/* i18n */ { id: 'Get Offer Record' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the details for a specific offer' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'offer_id', label: () => i18n._(/* i18n */ { id: 'Offer Id' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_getOfferRecord',
        title: () => i18n._(/* i18n */ { id: 'Get Offer Record' }),
        message: () => i18n._(/* i18n */ { id: 'Requests the details for a specific offer' }),
        handler: (params) => getOffer(params, false),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.cat_asset_id_to_name': {
    title: () => i18n._(/* i18n */ { id: 'Get CAT Wallet Info' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the CAT wallet info' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'asset_id', label: () => i18n._(/* i18n */ { id: 'Asset Id' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_getCATWalletInfo',
        title: () => i18n._(/* i18n */ { id: 'Get CAT Wallet Info' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.cat_get_asset_id': {
    title: () => i18n._(/* i18n */ { id: 'Get CAT Asset Id' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the CAT asset ID for a specific CAT wallet' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' }],
    dapp: [
      {
        command: 'chia_getCATAssetId',
        title: () => i18n._(/* i18n */ { id: 'Get CAT Asset Id' }),
        message: () => i18n._(/* i18n */ { id: 'Requests the CAT asset ID for a specific CAT wallet' }),
        transform: (data) => (data.asset_id ? normalizeHex(data.asset_id as string) : data.asset_id),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.nft_get_nfts': {
    title: () => i18n._(/* i18n */ { id: 'Get NFTs' }),
    message: () =>
      i18n._(
        /* i18n */ {
          id: 'Requests a full or paginated listing of NFTs associated with one or more wallets associated with the current wallet key',
        },
      ),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      { name: 'wallet_ids', label: () => i18n._(/* i18n */ { id: 'Wallet Ids' }), type: 'json' },
      {
        name: 'num',
        label: () => i18n._(/* i18n */ { id: 'Number of NFTs' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'start_index',
        label: () => i18n._(/* i18n */ { id: 'Start Index' }),
        type: 'number',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_getNFTs',
        title: () => i18n._(/* i18n */ { id: 'Get NFTs' }),
        message: () =>
          i18n._(
            /* i18n */ {
              id: 'Requests a full or paginated listing of NFTs associated with one or more wallets associated with the current wallet key',
            },
          ),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.nft_get_info': {
    title: () => i18n._(/* i18n */ { id: 'Get NFT Info' }),
    message: () => i18n._(/* i18n */ { id: 'Requests details for a specific NFT' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'coin_id', label: () => i18n._(/* i18n */ { id: 'Coin Id' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_getNFTInfo',
        title: () => i18n._(/* i18n */ { id: 'Get NFT Info' }),
        message: () => i18n._(/* i18n */ { id: 'Requests details for a specific NFT' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.nft_count_nfts': {
    title: () => i18n._(/* i18n */ { id: 'Get NFTs Count' }),
    message: () =>
      i18n._(
        /* i18n */ {
          id: 'Requests the number of NFTs associated with one or more wallets associated with the current wallet key',
        },
      ),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'wallet_ids', label: () => i18n._(/* i18n */ { id: 'Wallet Ids' }), type: 'json' }],
    dapp: [
      {
        command: 'chia_getNFTsCount',
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.nft_get_wallets_with_dids': {
    title: () => i18n._(/* i18n */ { id: 'Get NFT Wallets with DIDs' }),
    message: () =>
      i18n._(
        /* i18n */ { id: 'Requests a complete listing of the NFT wallets associated with the current wallet key' },
      ),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [],
    dapp: [
      {
        command: 'chia_getNFTWalletsWithDIDs',
        title: () => i18n._(/* i18n */ { id: 'Get NFT Wallets with DIDs' }),
        transform: (data) => data.nft_wallets,
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.did_get_current_coin_info': {
    title: () => i18n._(/* i18n */ { id: 'Get DID Current Coin Info' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the current coin info for a specific DID' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' }],
    dapp: [
      {
        command: 'chia_getDIDCurrentCoinInfo',
        title: () => i18n._(/* i18n */ { id: 'Get DID Current Coin Info' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.did_get_did': {
    title: () => i18n._(/* i18n */ { id: 'Get DID' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the DID' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' }],
    dapp: [
      {
        command: 'chia_getDID',
        title: () => i18n._(/* i18n */ { id: 'Get DID' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.did_get_info': {
    title: () => i18n._(/* i18n */ { id: 'Get DID Info' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the info for a specific DID' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'coin_id', label: () => i18n._(/* i18n */ { id: 'Coin Id' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_getDIDInfo',
        title: () => i18n._(/* i18n */ { id: 'Get DID Info' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.did_get_metadata': {
    title: () => i18n._(/* i18n */ { id: 'Get DID Metadata' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the metadata for a specific DID' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' }],
    dapp: [
      {
        command: 'chia_getDIDMetadata',
        title: () => i18n._(/* i18n */ { id: 'Get DID Metadata' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.did_get_pubkey': {
    title: () => i18n._(/* i18n */ { id: 'Get DID Public Key' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the public key for a specific DID' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' }],
    dapp: [
      {
        command: 'chia_getDIDPubkey',
        title: () => i18n._(/* i18n */ { id: 'Get DID Public Key' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.did_get_wallet_name': {
    title: () => i18n._(/* i18n */ { id: 'Get DID Name' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the name for a specific DID' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'number' }],
    dapp: [
      {
        command: 'chia_getDIDName',
        title: () => i18n._(/* i18n */ { id: 'Get DID Name' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.vc_get_list': {
    title: () => i18n._(/* i18n */ { id: 'Get All Verifiable Credentials' }),
    message: () => i18n._(/* i18n */ { id: 'Requests a complete listing of all verifiable credentials' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [],
    dapp: [
      {
        command: 'chia_getVCList',
        title: () => i18n._(/* i18n */ { id: 'Get All Verifiable Credentials' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.vc_get': {
    title: () => i18n._(/* i18n */ { id: 'Get Verifiable Credential' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the verifiable credential for a specific launcher id' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'vc_id', label: () => i18n._(/* i18n */ { id: 'Launcher Id' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_getVC',
        title: () => i18n._(/* i18n */ { id: 'Get Verifiable Credential' }),
        transform: (data) => data.vc_record,
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_wallet.vc_get_proofs_for_root': {
    title: () => i18n._(/* i18n */ { id: 'Get Proofs For Root Hash' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the proofs for a specific root hash' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'root', label: () => i18n._(/* i18n */ { id: 'Proofs Hash' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_getProofsForRoot',
        title: () => i18n._(/* i18n */ { id: 'Get Proofs For Root Hash' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_data_layer.get_keys': {
    title: () => i18n._(/* i18n */ { id: 'Get Keys' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the keys for a specific store' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' },
      {
        name: 'root_hash',
        label: () => i18n._(/* i18n */ { id: 'Root Hash' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'page',
        label: () => i18n._(/* i18n */ { id: 'Page' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'max_page_size',
        label: () => i18n._(/* i18n */ { id: 'Max page size' }),
        type: 'number',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_getKeys',
        title: () => i18n._(/* i18n */ { id: 'Get Keys' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_data_layer.get_keys_values': {
    title: () => i18n._(/* i18n */ { id: 'Get Keys Values' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the values for a specific store' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' },
      {
        name: 'root_hash',
        label: () => i18n._(/* i18n */ { id: 'Root Hash' }),
        type: 'string',
        isOptional: true,
      },
      {
        name: 'page',
        label: () => i18n._(/* i18n */ { id: 'Page' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'max_page_size',
        label: () => i18n._(/* i18n */ { id: 'Max page size' }),
        type: 'number',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_getKeysValues',
        title: () => i18n._(/* i18n */ { id: 'Get Keys Values' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_data_layer.get_kv_diff': {
    title: () => i18n._(/* i18n */ { id: 'Get Kv Diff' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the diff between two hashes for a specific store' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' },
      { name: 'hash_1', label: () => i18n._(/* i18n */ { id: 'Hash 1' }), type: 'string' },
      { name: 'hash_2', label: () => i18n._(/* i18n */ { id: 'Hash 2' }), type: 'string' },
      {
        name: 'page',
        label: () => i18n._(/* i18n */ { id: 'Page' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'max_page_size',
        label: () => i18n._(/* i18n */ { id: 'Max page size' }),
        type: 'number',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_getKvDiff',
        title: () => i18n._(/* i18n */ { id: 'Get Kv Diff' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_data_layer.get_local_root': {
    title: () => i18n._(/* i18n */ { id: 'Get Local Root' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the local root for a specific store' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_getLocalRoot',
        title: () => i18n._(/* i18n */ { id: 'Get Local Root' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_data_layer.get_mirrors': {
    title: () => i18n._(/* i18n */ { id: 'Get Mirrors' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the mirrors for a specific store' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_getMirrors',
        title: () => i18n._(/* i18n */ { id: 'Get Mirrors' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_data_layer.get_owned_stores': {
    title: () => i18n._(/* i18n */ { id: 'Get Owned Stores' }),
    message: () => i18n._(/* i18n */ { id: 'Requests a complete listing of all owned stores' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [],
    dapp: [
      {
        command: 'chia_getOwnedStores',
        title: () => i18n._(/* i18n */ { id: 'Get Owned Stores' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_data_layer.get_root': {
    title: () => i18n._(/* i18n */ { id: 'Get Root' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the root for a specific store' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_getRoot',
        title: () => i18n._(/* i18n */ { id: 'Get Root' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_data_layer.get_roots': {
    title: () => i18n._(/* i18n */ { id: 'Get Roots' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the roots for a specific store ids' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'ids', label: () => i18n._(/* i18n */ { id: 'Store Ids' }), type: 'json' }],
    dapp: [
      {
        command: 'chia_getRoots',
        title: () => i18n._(/* i18n */ { id: 'Get Roots' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_data_layer.get_root_history': {
    title: () => i18n._(/* i18n */ { id: 'Get Root History' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the history for a specific store' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_getRootHistory',
        title: () => i18n._(/* i18n */ { id: 'Get Root History' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_data_layer.get_sync_status': {
    title: () => i18n._(/* i18n */ { id: 'Get DataLayer Sync Status' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the sync status for a specific store' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [{ name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' }],
    dapp: [
      {
        command: 'chia_getDataLayerSyncStatus',
        title: () => i18n._(/* i18n */ { id: 'Get DataLayer Sync Status' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'chia_data_layer.get_value': {
    title: () => i18n._(/* i18n */ { id: 'Get Value' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the value for a specific store and key' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'string' },
      { name: 'key', label: () => i18n._(/* i18n */ { id: 'Key' }), type: 'string' },
      {
        name: 'root_hash',
        label: () => i18n._(/* i18n */ { id: 'Root Hash' }),
        type: 'string',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_getValue',
        title: () => i18n._(/* i18n */ { id: 'Get Value' }),
        allowConfirmationBypass: true,
      },
    ],
  },

  'daemon.get_wallet_addresses': {
    title: () => i18n._(/* i18n */ { id: 'Get wallet addresses for one or more wallet keys' }),
    message: () => i18n._(/* i18n */ { id: 'Requests the addresses for a specific wallet keys' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Proceed' }),
    params: [
      {
        name: 'fingerprints',
        label: () => i18n._(/* i18n */ { id: 'Fingerprints' }),
        type: 'json',
        isOptional: true,
      },
      {
        name: 'index',
        label: () => i18n._(/* i18n */ { id: 'Index' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'count',
        label: () => i18n._(/* i18n */ { id: 'Count' }),
        type: 'number',
        isOptional: true,
      },
      {
        name: 'non_observer_derivation',
        label: () => i18n._(/* i18n */ { id: 'Non Observer Derivation' }),
        type: 'bool',
        isOptional: true,
      },
    ],
    dapp: [
      {
        command: 'chia_getWalletAddresses',
        title: () => i18n._(/* i18n */ { id: 'Get wallet addresses for one or more wallet keys' }),
        transform: (data) => data.wallet_addresses,
        allowConfirmationBypass: true,
      },
    ],
  },
};

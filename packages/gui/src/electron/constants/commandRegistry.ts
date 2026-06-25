// Keys are `<destination>.<command>`; param names are snake_case (wire form).
// `dapp.wcCommand` is `chia_<name>` to match WC `proposal.methods`. Dapp
// surface is opt-in: no `dapp` block = UI-only command; no `dappAllowed: true`
// on a param = dapp can't send it. `validateDappParams` fails closed.
import { WcError, WcErrorCode } from '../../@types/WcError';
import { i18n } from '../../config/locales';
import NotificationType from '../../constants/NotificationType';
import { buildCreateOfferDisplay, buildTakeOfferDisplay, lookupCat } from '../utils/dappEnrichment';
import type { EnrichmentDisplay } from '../utils/dappEnrichment';

export type ParamType = 'text' | 'mojo-to-xch' | 'mojo-to-cat' | 'bool' | 'json';

type ParamSchemaBase = {
  name: string;
  label: () => string;
  isOptional?: boolean;
  /** Hidden from the Confirm dialog. */
  hide?: boolean;
  /** Default false — secure by default. */
  dappAllowed?: boolean;
};

export type ParamSchema = ParamSchemaBase &
  (
    | { type: 'text' }
    | { type: 'mojo-to-xch' }
    /** `<amount> <symbol>`; symbol fetched via wallet id at `data[symbolFrom]`. */
    | { type: 'mojo-to-cat'; symbolFrom: string }
    | { type: 'bool' }
    | { type: 'json' }
  );

export type WcAlias = {
  wcCommand: string;
  label?: () => string;
  description?: () => string;
  /** Merged on top of base `dapp.defaults`; alias values override. */
  defaults?: Record<string, unknown>;
  requiresSync?: boolean;
};

export type DappCommandSchema = {
  wcCommand: string;
  label?: () => string;
  description?: () => string;
  requiresSync?: boolean;
  defaults?: Record<string, unknown>;
  aliases?: WcAlias[];
  /** Routes to `dappHandlers[handlerKey]` instead of the daemon. */
  handlerKey?: string;
  /**
   * Reshapes the camelCased daemon response into the dapp-facing payload.
   * Mirrors what legacy `api-react` RTK endpoints did via `transformResponse` —
   * dapps that worked against the legacy endpoint expect the same shape.
   * Only applies on the daemon-routed path (handlers produce their own data).
   */
  transformResponse?: (data: Record<string, unknown>) => unknown;
};

// Strings are functions to defer i18n resolution past startup so locale
// switches take effect on the next read.
export type CommandSchema = {
  title?: () => string;
  message?: () => string;
  confirmLabel?: () => string;
  destructive?: boolean;
  params: ParamSchema[];
  enrich?: (data: Record<string, unknown>) => Promise<EnrichmentDisplay>;
  /** Absent = UI-only command. */
  dapp?: DappCommandSchema;
};

const DEFAULT_TITLE = () => i18n._(/* i18n */ { id: 'Confirm' });
const DEFAULT_MESSAGE = () => i18n._(/* i18n */ { id: 'Please review and confirm this action.' });
const DEFAULT_CONFIRM_LABEL = () => i18n._(/* i18n */ { id: 'Proceed' });

export function resolveTexts(schema: CommandSchema | undefined): {
  title: string;
  message: string;
  confirmLabel: string;
} {
  return {
    title: (schema?.title ?? DEFAULT_TITLE)(),
    message: (schema?.message ?? DEFAULT_MESSAGE)(),
    confirmLabel: (schema?.confirmLabel ?? DEFAULT_CONFIRM_LABEL)(),
  };
}

const FALLBACK: CommandSchema = {
  params: [],
};

// `chia_app.*` is handler-routed (no daemon RPC); `resolveDispatch` rejects
// it so callers must check `entry.handlerKey` first.
const RENDERER_NAMESPACE = 'chia_app';

const SCHEMAS: Record<string, CommandSchema> = {
  // ── Handler-routed (pure dapp, no daemon RPC) ─────────────────────────────
  'chia_app.request_permissions': {
    params: [{ name: 'commands', label: () => i18n._(/* i18n */ { id: 'Commands' }), type: 'json', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_requestPermissions',
      label: () => i18n._(/* i18n */ { id: 'Request Permissions' }),
      description: () => i18n._(/* i18n */ { id: 'App is requesting permission to execute these commands' }),
      handlerKey: 'requestPermissions',
    },
  },

  'chia_app.show_notification': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Notification' }),
    message: () => i18n._(/* i18n */ { id: 'This app wants to show you a notification.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Show' }),
    params: [
      { name: 'type', label: () => i18n._(/* i18n */ { id: 'Type' }), type: 'text', dappAllowed: true },
      {
        name: 'message',
        label: () => i18n._(/* i18n */ { id: 'Message' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'url',
        label: () => i18n._(/* i18n */ { id: 'URL' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'offer_data',
        label: () => i18n._(/* i18n */ { id: 'Offer Data' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'all_fingerprints',
        label: () => i18n._(/* i18n */ { id: 'All Wallets' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    enrich: async (data) => {
      if (data.type === NotificationType.OFFER && typeof data.offer_data === 'string' && data.offer_data) {
        const offer = await buildTakeOfferDisplay({ offer: data.offer_data });
        return offer ? { offer } : {};
      }
      return {};
    },
    dapp: {
      wcCommand: 'chia_showNotification',
      label: () => i18n._(/* i18n */ { id: 'Show Notification' }),
      description: () => i18n._(/* i18n */ { id: 'Show notification with offer or general announcement' }),
      handlerKey: 'showNotification',
    },
  },

  'chia_app.add_cat_token': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Add CAT Token' }),
    message: () => i18n._(/* i18n */ { id: 'This app wants to add a CAT token to your wallet.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Add' }),
    params: [
      { name: 'asset_id', label: () => i18n._(/* i18n */ { id: 'Asset Id' }), type: 'text', dappAllowed: true },
      { name: 'name', label: () => i18n._(/* i18n */ { id: 'Name' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_addCATToken',
      label: () => i18n._(/* i18n */ { id: 'Add CAT Token' }),
      handlerKey: 'addCATToken',
    },
  },

  'chia_app.transfer_did': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Transfer DID' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this DID transfer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Transfer' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
      {
        name: 'inner_address',
        label: () => i18n._(/* i18n */ { id: 'Inner Address' }),
        type: 'text',
        dappAllowed: true,
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'with_recovery_info',
        label: () => i18n._(/* i18n */ { id: 'With Recovery Info' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'reuse_puzhash',
        label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_transferDID',
      label: () => i18n._(/* i18n */ { id: 'Transfer DID' }),
      handlerKey: 'transferDID',
    },
  },

  'chia_app.create_new_did_wallet': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Create DID Wallet' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm creating this DID wallet.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      { name: 'amount', label: () => i18n._(/* i18n */ { id: 'Amount' }), type: 'mojo-to-xch', dappAllowed: true },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch', dappAllowed: true },
      { name: 'backup_dids', label: () => i18n._(/* i18n */ { id: 'Backup DIDs' }), type: 'json', dappAllowed: true },
      {
        name: 'num_of_backup_ids_needed',
        label: () => i18n._(/* i18n */ { id: 'Number of Backup Ids Needed' }),
        type: 'text',
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_createNewDIDWallet',
      label: () => i18n._(/* i18n */ { id: 'Create new DID Wallet' }),
      handlerKey: 'createNewDIDWallet',
    },
  },

  // ── Wallet (mutating, dapp-callable) ──────────────────────────────────────
  'chia_wallet.send_transaction': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Send Transaction' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this blockchain transaction.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'amount', label: () => i18n._(/* i18n */ { id: 'Amount' }), type: 'mojo-to-xch', dappAllowed: true },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch', dappAllowed: true },
      { name: 'address', label: () => i18n._(/* i18n */ { id: 'Address' }), type: 'text', dappAllowed: true },
      {
        name: 'wallet_id',
        label: () => i18n._(/* i18n */ { id: 'Wallet Id' }),
        type: 'text',
        hide: true,
        dappAllowed: true,
      },
      {
        name: 'memos',
        label: () => i18n._(/* i18n */ { id: 'Memos' }),
        type: 'json',
        isOptional: true,
        hide: true,
        dappAllowed: true,
      },
      {
        name: 'puzzle_decorator',
        label: () => i18n._(/* i18n */ { id: 'Puzzle Decorator' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_sendTransaction',
      label: () => i18n._(/* i18n */ { id: 'Send Transaction' }),
      requiresSync: true,
      defaults: { wallet_id: 1 },
    },
  },

  'chia_wallet.cat_spend': {
    title: () => i18n._(/* i18n */ { id: 'Confirm CAT Spend' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this CAT spend.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
      { name: 'address', label: () => i18n._(/* i18n */ { id: 'Address' }), type: 'text', dappAllowed: true },
      {
        name: 'amount',
        label: () => i18n._(/* i18n */ { id: 'Amount' }),
        type: 'mojo-to-cat',
        symbolFrom: 'wallet_id',
        dappAllowed: true,
      },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch', dappAllowed: true },
      {
        name: 'memos',
        label: () => i18n._(/* i18n */ { id: 'Memos' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    enrich: async (data) => {
      const walletId = data.wallet_id;
      if (walletId === undefined || walletId === null) return {};
      const cat = await lookupCat(walletId as number | string);
      return cat ? { cat } : {};
    },
    dapp: {
      wcCommand: 'chia_spendCAT',
      label: () => i18n._(/* i18n */ { id: 'Spend CAT' }),
      requiresSync: true,
    },
  },

  'chia_wallet.nft_transfer_nft': {
    title: () => i18n._(/* i18n */ { id: 'Confirm NFT Transfer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this NFT transfer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Transfer' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
      {
        name: 'nft_coin_ids',
        label: () => i18n._(/* i18n */ { id: 'NFT Coin Ids' }),
        type: 'json',
        dappAllowed: true,
      },
      {
        name: 'target_address',
        label: () => i18n._(/* i18n */ { id: 'Target Address' }),
        type: 'text',
        dappAllowed: true,
      },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_transferNFT',
      label: () => i18n._(/* i18n */ { id: 'Transfer NFT' }),
    },
  },

  'chia_wallet.nft_transfer_bulk': {
    title: () => i18n._(/* i18n */ { id: 'Confirm NFT Transfer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this NFT transfer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Transfer' }),
    params: [
      { name: 'nft_coin_list', label: () => i18n._(/* i18n */ { id: 'NFT Coin List' }), type: 'json' },
      { name: 'target_address', label: () => i18n._(/* i18n */ { id: 'Target Address' }), type: 'text' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  'chia_wallet.cancel_offer': {
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this offer cancellation.' }),
    destructive: true,
    params: [
      { name: 'trade_id', label: () => i18n._(/* i18n */ { id: 'Trade Id' }), type: 'text', dappAllowed: true },
      { name: 'secure', label: () => i18n._(/* i18n */ { id: 'Secure' }), type: 'bool', dappAllowed: true },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_cancelOffer',
      label: () => i18n._(/* i18n */ { id: 'Cancel Offer' }),
    },
  },

  'chia_wallet.create_offer_for_ids': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Create Offer' }),
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
        dappAllowed: true,
      },
      { name: 'driver_dict', label: () => i18n._(/* i18n */ { id: 'Driver Dict' }), type: 'json', dappAllowed: true },
      {
        name: 'validate_only',
        label: () => i18n._(/* i18n */ { id: 'Validate Only' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'disable_json_formatting',
        label: () => i18n._(/* i18n */ { id: 'Disable JSON Formatting' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
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
        dappAllowed: true,
      },
      {
        name: 'coin_ids',
        label: () => i18n._(/* i18n */ { id: 'Coin Ids' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'allow_unsynced',
        label: () => i18n._(/* i18n */ { id: 'Allow Unsynced' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    enrich: async (data) => {
      const offer = await buildCreateOfferDisplay(data);
      return offer ? { offer } : {};
    },
    dapp: {
      wcCommand: 'chia_createOfferForIds',
      label: () => i18n._(/* i18n */ { id: 'Create Offer for Ids' }),
    },
  },

  'chia_wallet.take_offer': {
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this offer acceptance.' }),
    params: [
      { name: 'offer', label: () => i18n._(/* i18n */ { id: 'Offer' }), type: 'text', dappAllowed: true },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch', dappAllowed: true },
      {
        name: 'extra_conditions',
        label: () => i18n._(/* i18n */ { id: 'Extra Conditions' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    enrich: async (data) => {
      const offer = await buildTakeOfferDisplay(data);
      return offer ? { offer } : {};
    },
    dapp: {
      wcCommand: 'chia_takeOffer',
      label: () => i18n._(/* i18n */ { id: 'Take Offer' }),
    },
  },

  'chia_wallet.sign_message_by_address': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Sign Message' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to sign this message?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Sign' }),
    params: [
      { name: 'address', label: () => i18n._(/* i18n */ { id: 'Address' }), type: 'text', dappAllowed: true },
      { name: 'message', label: () => i18n._(/* i18n */ { id: 'Message' }), type: 'text', dappAllowed: true },
      {
        name: 'is_hex',
        label: () => i18n._(/* i18n */ { id: 'Hex Encoded' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'safe_mode',
        label: () => i18n._(/* i18n */ { id: 'Safe Mode' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_signMessageByAddress',
      label: () => i18n._(/* i18n */ { id: 'Sign Message by Address' }),
    },
  },

  'chia_wallet.sign_message_by_id': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Sign Message' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to sign this message?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Sign' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Id' }), type: 'text', dappAllowed: true },
      { name: 'message', label: () => i18n._(/* i18n */ { id: 'Message' }), type: 'text', dappAllowed: true },
      {
        name: 'is_hex',
        label: () => i18n._(/* i18n */ { id: 'Hex Encoded' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_signMessageById',
      label: () => i18n._(/* i18n */ { id: 'Sign Message by Id' }),
    },
  },

  'chia_wallet.nft_set_nft_did': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Move NFT to DID' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to move this NFT to the specified profile?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Move' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
      {
        name: 'nft_launcher_id',
        label: () => i18n._(/* i18n */ { id: 'NFT Launcher Id' }),
        type: 'text',
        dappAllowed: true,
      },
      {
        name: 'nft_coin_ids',
        label: () => i18n._(/* i18n */ { id: 'NFT Coin Ids' }),
        type: 'json',
        dappAllowed: true,
      },
      { name: 'did', label: () => i18n._(/* i18n */ { id: 'DID' }), type: 'text', dappAllowed: true },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_setNFTDID',
      label: () => i18n._(/* i18n */ { id: 'Set NFT DID' }),
    },
  },

  'chia_wallet.nft_set_did_bulk': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Move NFTs to DID' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to move these NFTs to the specified profile?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Move' }),
    params: [
      { name: 'nft_coin_list', label: () => i18n._(/* i18n */ { id: 'NFT Coin List' }), type: 'json' },
      { name: 'did_id', label: () => i18n._(/* i18n */ { id: 'DID' }), type: 'text' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  // ── Wallet (UI-only mutations) ─────────────────────────────────────────────
  'chia_wallet.set_auto_claim': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Set Auto Claim' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to set auto claim?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Set' }),
    params: [
      { name: 'enabled', label: () => i18n._(/* i18n */ { id: 'Enabled' }), type: 'bool' },
      { name: 'tx_fee', label: () => i18n._(/* i18n */ { id: 'Transaction Fee' }), type: 'mojo-to-xch' },
      { name: 'min_amount', label: () => i18n._(/* i18n */ { id: 'Min Amount' }), type: 'mojo-to-xch' },
    ],
  },

  'chia_wallet.create_new_wallet': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Create New Wallet' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to create a new wallet?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      { name: 'wallet_name', label: () => i18n._(/* i18n */ { id: 'Name' }), type: 'text' },
      { name: 'wallet_type', label: () => i18n._(/* i18n */ { id: 'Type' }), type: 'text' },
      { name: 'asset_id', label: () => i18n._(/* i18n */ { id: 'Asset ID' }), type: 'text' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  'chia_wallet.delete_key': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Delete Wallet' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to delete this wallet?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Delete' }),
    destructive: true,
    params: [{ name: 'fingerprint', label: () => i18n._(/* i18n */ { id: 'Fingerprint' }), type: 'text' }],
  },

  'chia_wallet.set_payout_instructions': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Set Payout Instructions' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to set payout instructions?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Set' }),
    params: [
      { name: 'payout_instructions', label: () => i18n._(/* i18n */ { id: 'Payout Instructions' }), type: 'text' },
    ],
  },

  // ── Harvester / full-node / farmer / daemon (UI-only) ──────────────────────
  'chia_harvester.delete_plot': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Delete Plot' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Delete' }),
    destructive: true,
    params: [{ name: 'filename', label: () => i18n._(/* i18n */ { id: 'Filename' }), type: 'text' }],
  },

  'chia_harvester.add_plot_directory': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Add Plot Directory' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Add' }),
    params: [{ name: 'dirname', label: () => i18n._(/* i18n */ { id: 'Directory' }), type: 'text' }],
  },

  'chia_harvester.remove_plot_directory': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Remove Plot Directory' }),
    destructive: true,
    params: [{ name: 'dirname', label: () => i18n._(/* i18n */ { id: 'Directory' }), type: 'text' }],
  },

  'chia_full_node.open_connection': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Open Connection' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to open a connection to the specified node?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Connect' }),
    params: [
      { name: 'host', label: () => i18n._(/* i18n */ { id: 'Host' }), type: 'text' },
      { name: 'port', label: () => i18n._(/* i18n */ { id: 'Port' }), type: 'text' },
    ],
  },

  'chia_full_node.close_connection': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Disconnect' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Disconnect' }),
    destructive: true,
    params: [],
  },

  'chia_farmer.close_connection': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Disconnect' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Disconnect' }),
    destructive: true,
    params: [],
  },

  'chia_farmer.set_payout_instructions': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Set Payout Instructions' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to set payout instructions?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Set' }),
    params: [
      { name: 'payout_instructions', label: () => i18n._(/* i18n */ { id: 'Payout Instructions' }), type: 'text' },
    ],
  },

  'daemon.stop_plotting': {
    confirmLabel: () => i18n._(/* i18n */ { id: 'Stop' }),
    destructive: true,
    params: [],
  },

  // ── Login / fingerprint switch ─────────────────────────────────────────────
  'chia_wallet.log_in': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Log In' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to switch to this wallet key?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Log In' }),
    params: [
      { name: 'fingerprint', label: () => i18n._(/* i18n */ { id: 'Fingerprint' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_logIn',
      label: () => i18n._(/* i18n */ { id: 'Log In' }),
    },
  },

  // ── Transactions ───────────────────────────────────────────────────────────
  'chia_wallet.spend_clawback_coins': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Clawback Spend' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this clawback spend.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'coin_ids', label: () => i18n._(/* i18n */ { id: 'Coin Ids' }), type: 'json', dappAllowed: true },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_spendClawbackCoins',
      label: () => i18n._(/* i18n */ { id: 'Claw back or claim claw back transaction' }),
      requiresSync: true,
    },
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
        dappAllowed: true,
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'push',
        label: () => i18n._(/* i18n */ { id: 'Push' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'sign',
        label: () => i18n._(/* i18n */ { id: 'Sign' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'allow_unsynced',
        label: () => i18n._(/* i18n */ { id: 'Allow Unsynced' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_pushTransactions',
      label: () => i18n._(/* i18n */ { id: 'Push Transactions' }),
      description: () => i18n._(/* i18n */ { id: 'Push a list of transactions to the blockchain via the wallet' }),
    },
  },

  'chia_full_node.push_tx': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Push Transaction' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm pushing this transaction.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Push' }),
    params: [
      { name: 'spend_bundle', label: () => i18n._(/* i18n */ { id: 'Spend Bundle' }), type: 'json', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_pushTx',
      label: () => i18n._(/* i18n */ { id: 'Push Transaction' }),
      description: () => i18n._(/* i18n */ { id: 'Push a spend bundle (transaction) to the blockchain' }),
    },
  },

  // ── NFTs ───────────────────────────────────────────────────────────────────
  'chia_wallet.nft_mint_nft': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Mint NFT' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this NFT mint.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Mint' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
      {
        name: 'royalty_address',
        label: () => i18n._(/* i18n */ { id: 'Royalty Address' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'royalty_percentage',
        label: () => i18n._(/* i18n */ { id: 'Royalty Percentage' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'target_address',
        label: () => i18n._(/* i18n */ { id: 'Target Address' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      { name: 'uris', label: () => i18n._(/* i18n */ { id: 'URIs' }), type: 'json', dappAllowed: true },
      { name: 'hash', label: () => i18n._(/* i18n */ { id: 'Hash' }), type: 'text', dappAllowed: true },
      { name: 'meta_uris', label: () => i18n._(/* i18n */ { id: 'Meta URIs' }), type: 'json', dappAllowed: true },
      {
        name: 'meta_hash',
        label: () => i18n._(/* i18n */ { id: 'Meta Hash' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'license_uris',
        label: () => i18n._(/* i18n */ { id: 'License URIs' }),
        type: 'json',
        dappAllowed: true,
      },
      {
        name: 'license_hash',
        label: () => i18n._(/* i18n */ { id: 'License Hash' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'edition_number',
        label: () => i18n._(/* i18n */ { id: 'Edition Number' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'edition_total',
        label: () => i18n._(/* i18n */ { id: 'Edition Total' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'did_id',
        label: () => i18n._(/* i18n */ { id: 'DID Id' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_mintNFT',
      label: () => i18n._(/* i18n */ { id: 'Mint NFT' }),
    },
  },

  'chia_wallet.nft_mint_bulk': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Bulk Mint NFTs' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this bulk NFT mint.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Mint' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
      {
        name: 'metadata_list',
        label: () => i18n._(/* i18n */ { id: 'Metadata List' }),
        type: 'json',
        dappAllowed: true,
      },
      {
        name: 'royalty_percentage',
        label: () => i18n._(/* i18n */ { id: 'Royalty Percentage' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'royalty_address',
        label: () => i18n._(/* i18n */ { id: 'Royalty Address' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'target_list',
        label: () => i18n._(/* i18n */ { id: 'Target List' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'mint_number_start',
        label: () => i18n._(/* i18n */ { id: 'Mint Start Number' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'mint_total',
        label: () => i18n._(/* i18n */ { id: 'Mint Total' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'xch_coins',
        label: () => i18n._(/* i18n */ { id: 'XCH Coins' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'xch_change_target',
        label: () => i18n._(/* i18n */ { id: 'XCH Change Target' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'new_innerpuzhash',
        label: () => i18n._(/* i18n */ { id: 'New Inner Puzzle Hash' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'new_p_2_puzhash',
        label: () => i18n._(/* i18n */ { id: 'New P2 Puzzle Hash' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'did_coin',
        label: () => i18n._(/* i18n */ { id: 'DID Coin' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'did_lineage_parent',
        label: () => i18n._(/* i18n */ { id: 'DID Lineage Parent' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'mint_from_did',
        label: () => i18n._(/* i18n */ { id: 'Mint From DID' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'reuse_puzhash',
        label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_mintBulk',
      label: () => i18n._(/* i18n */ { id: 'Mint Bulk' }),
      description: () => i18n._(/* i18n */ { id: 'Create a spend bundle to mint multiple NFTs' }),
    },
  },

  // ── DIDs ───────────────────────────────────────────────────────────────────
  'chia_wallet.did_find_lost': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Find Lost DID' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to recover this DID?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Recover' }),
    params: [
      { name: 'coin_id', label: () => i18n._(/* i18n */ { id: 'Coin Id' }), type: 'text', dappAllowed: true },
      {
        name: 'recovery_list_hash',
        label: () => i18n._(/* i18n */ { id: 'Recovery List Hash' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'num_verification',
        label: () => i18n._(/* i18n */ { id: 'Required Number of DIDs for Verification' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'metadata',
        label: () => i18n._(/* i18n */ { id: 'DID Metadata' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_findLostDID',
      label: () => i18n._(/* i18n */ { id: 'Find Lost DID' }),
    },
  },

  'chia_wallet.did_update_metadata': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Update DID Metadata' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this DID metadata update.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Update' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
      {
        name: 'metadata',
        label: () => i18n._(/* i18n */ { id: 'DID Metadata' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'reuse_puzhash',
        label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_updateDIDMetadata',
      label: () => i18n._(/* i18n */ { id: 'Update DID Metadata' }),
    },
  },

  'chia_wallet.did_update_recovery_ids': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Update DID Recovery Ids' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this DID recovery list update.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Update' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
      {
        name: 'new_list',
        label: () => i18n._(/* i18n */ { id: 'New Recovery List' }),
        type: 'json',
        dappAllowed: true,
      },
      {
        name: 'num_verifications_required',
        label: () => i18n._(/* i18n */ { id: 'Verifications Required' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'reuse_puzhash',
        label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_updateDIDRecoveryIds',
      label: () => i18n._(/* i18n */ { id: 'Update DID Recovery Ids' }),
    },
  },

  'chia_wallet.did_set_wallet_name': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Set DID Name' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm renaming this DID wallet.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Set' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
      { name: 'name', label: () => i18n._(/* i18n */ { id: 'Name' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_setDIDName',
      label: () => i18n._(/* i18n */ { id: 'Set DID Name' }),
    },
  },

  // ── VCs ────────────────────────────────────────────────────────────────────
  'chia_wallet.vc_spend': {
    title: () => i18n._(/* i18n */ { id: 'Confirm VC Spend' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this verifiable credential spend.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'vc_id', label: () => i18n._(/* i18n */ { id: 'VC Id' }), type: 'text', dappAllowed: true },
      {
        name: 'new_puzhash',
        label: () => i18n._(/* i18n */ { id: 'New Puzzle Hash' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'new_proof_hash',
        label: () => i18n._(/* i18n */ { id: 'New Proof Hash' }),
        type: 'text',
        dappAllowed: true,
      },
      {
        name: 'provider_inner_puzhash',
        label: () => i18n._(/* i18n */ { id: 'Provider Inner Puzzle Hash' }),
        type: 'text',
        dappAllowed: true,
      },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'reuse_puzhash',
        label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_spendVC',
      label: () => i18n._(/* i18n */ { id: 'Add Proofs To Verifiable Credential' }),
    },
  },

  'chia_wallet.vc_add_proofs': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Add VC Proofs' }),
    message: () =>
      i18n._(/* i18n */ { id: 'Please carefully review and confirm adding proofs to this verifiable credential.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Add' }),
    params: [{ name: 'proofs', label: () => i18n._(/* i18n */ { id: 'Proofs' }), type: 'json', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_addVCProofs',
      label: () => i18n._(/* i18n */ { id: 'Add Proofs' }),
    },
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
        type: 'text',
        dappAllowed: true,
      },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_revokeVC',
      label: () => i18n._(/* i18n */ { id: 'Revoke Verifiable Credential' }),
    },
  },

  // ── DataLayer (mutating) ───────────────────────────────────────────────────
  'chia_data_layer.create_data_store': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Create DataStore' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm creating this data store.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'verbose',
        label: () => i18n._(/* i18n */ { id: 'Verbose' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_createDataStore',
      label: () => i18n._(/* i18n */ { id: 'Create DataStore' }),
    },
  },

  'chia_data_layer.batch_update': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Update' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this data store update.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Update' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true },
      { name: 'changelist', label: () => i18n._(/* i18n */ { id: 'Changelist' }), type: 'json', dappAllowed: true },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'submit_on_chain',
        label: () => i18n._(/* i18n */ { id: 'Submit On Chain' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_batchUpdate',
      label: () => i18n._(/* i18n */ { id: 'Batch Update' }),
    },
  },

  'chia_data_layer.insert': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Insert' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this data store insert.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Insert' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true },
      { name: 'key', label: () => i18n._(/* i18n */ { id: 'Key' }), type: 'text', dappAllowed: true },
      { name: 'value', label: () => i18n._(/* i18n */ { id: 'Value' }), type: 'text', dappAllowed: true },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_insert',
      label: () => i18n._(/* i18n */ { id: 'Insert' }),
    },
  },

  'chia_data_layer.delete_key': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Delete Key' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to delete this key from the data store?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Delete' }),
    destructive: true,
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true },
      { name: 'key', label: () => i18n._(/* i18n */ { id: 'Key' }), type: 'text', dappAllowed: true },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_deleteKey',
      label: () => i18n._(/* i18n */ { id: 'Delete Key' }),
    },
  },

  'chia_data_layer.add_mirror': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Add Mirror' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm adding this mirror.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Add' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true },
      { name: 'urls', label: () => i18n._(/* i18n */ { id: 'URLs' }), type: 'json', dappAllowed: true },
      { name: 'amount', label: () => i18n._(/* i18n */ { id: 'Amount' }), type: 'text', dappAllowed: true },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_addMirror',
      label: () => i18n._(/* i18n */ { id: 'Add Mirror' }),
    },
  },

  'chia_data_layer.delete_mirror': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Delete Mirror' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to delete this mirror?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Delete' }),
    destructive: true,
    params: [
      { name: 'coin_id', label: () => i18n._(/* i18n */ { id: 'Coin Id' }), type: 'text', dappAllowed: true },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_deleteMirror',
      label: () => i18n._(/* i18n */ { id: 'Delete Mirror' }),
    },
  },

  'chia_data_layer.subscribe': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Subscribe' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this subscription.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Subscribe' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true },
      { name: 'urls', label: () => i18n._(/* i18n */ { id: 'URLs' }), type: 'json', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_subscribe',
      label: () => i18n._(/* i18n */ { id: 'Subscribe' }),
    },
  },

  'chia_data_layer.unsubscribe': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Unsubscribe' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this unsubscribe.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Unsubscribe' }),
    destructive: true,
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true },
      {
        name: 'retain',
        label: () => i18n._(/* i18n */ { id: 'Retain' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_unsubscribe',
      label: () => i18n._(/* i18n */ { id: 'Unsubscribe' }),
    },
  },

  'chia_data_layer.remove_subscriptions': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Remove Subscriptions' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to remove these subscription URLs?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Remove' }),
    destructive: true,
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true },
      { name: 'urls', label: () => i18n._(/* i18n */ { id: 'URLs' }), type: 'json', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_removeSubscriptions',
      label: () => i18n._(/* i18n */ { id: 'Remove Subscriptions' }),
    },
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
        dappAllowed: true,
      },
      {
        name: 'overwrite',
        label: () => i18n._(/* i18n */ { id: 'Overwrite' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'foldername',
        label: () => i18n._(/* i18n */ { id: 'Folder Name' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_addMissingFiles',
      label: () => i18n._(/* i18n */ { id: 'Add Missing Files' }),
    },
  },

  'chia_data_layer.check_plugins': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Check Plugins' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Check' }),
    params: [],
    dapp: {
      wcCommand: 'chia_checkPlugins',
      label: () => i18n._(/* i18n */ { id: 'Check Plugins' }),
    },
  },

  'chia_data_layer.clear_pending_roots': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Clear Pending Roots' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to clear pending roots for this store?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Clear' }),
    destructive: true,
    params: [{ name: 'store_id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_clearPendingRoots',
      label: () => i18n._(/* i18n */ { id: 'Clear Pending Roots' }),
    },
  },

  'chia_data_layer.get_ancestors': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Get Ancestors' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this query.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Query' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true },
      { name: 'hash', label: () => i18n._(/* i18n */ { id: 'Hash' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_getAncestors',
      label: () => i18n._(/* i18n */ { id: 'Get Ancestors' }),
    },
  },

  'chia_data_layer.subscriptions': {
    title: () => i18n._(/* i18n */ { id: 'Confirm List Subscriptions' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this query.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Query' }),
    params: [],
    dapp: {
      wcCommand: 'chia_subscriptions',
      label: () => i18n._(/* i18n */ { id: 'Subscriptions' }),
    },
  },

  'chia_data_layer.make_offer': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Make DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this DataLayer offer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      { name: 'maker', label: () => i18n._(/* i18n */ { id: 'Maker' }), type: 'json', dappAllowed: true },
      { name: 'taker', label: () => i18n._(/* i18n */ { id: 'Taker' }), type: 'json', dappAllowed: true },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_makeDataLayerOffer',
      label: () => i18n._(/* i18n */ { id: 'Make DataLayer Offer' }),
    },
  },

  'chia_data_layer.take_offer': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Take DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm taking this DataLayer offer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Accept' }),
    params: [
      { name: 'offer', label: () => i18n._(/* i18n */ { id: 'Offer' }), type: 'json', dappAllowed: true },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_takeDataLayerOffer',
      label: () => i18n._(/* i18n */ { id: 'Take DataLayer Offer' }),
    },
  },

  'chia_data_layer.cancel_offer': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Cancel DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm cancelling this DataLayer offer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Cancel' }),
    destructive: true,
    params: [
      { name: 'trade_id', label: () => i18n._(/* i18n */ { id: 'Trade Id' }), type: 'text', dappAllowed: true },
      { name: 'secure', label: () => i18n._(/* i18n */ { id: 'Secure' }), type: 'bool', dappAllowed: true },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_cancelDataLayerOffer',
      label: () => i18n._(/* i18n */ { id: 'Cancel DataLayer Offer' }),
    },
  },

  'chia_data_layer.verify_offer': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Verify DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this offer verification.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Verify' }),
    params: [
      { name: 'offer', label: () => i18n._(/* i18n */ { id: 'Offer' }), type: 'json', dappAllowed: true },
      {
        name: 'fee',
        label: () => i18n._(/* i18n */ { id: 'Fee' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_verifyOffer',
      label: () => i18n._(/* i18n */ { id: 'Verify Offer' }),
    },
  },

  // ── Remote wallets / coin tracking ─────────────────────────────────────────
  'chia_wallet.create_new_remote_wallet': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Create Remote Wallet' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm creating this remote wallet.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      {
        name: 'allow_unsynced',
        label: () => i18n._(/* i18n */ { id: 'Allow Unsynced' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_createNewRemoteWallet',
      label: () => i18n._(/* i18n */ { id: 'Create new Remote Wallet' }),
      handlerKey: 'createNewRemoteWallet',
    },
  },

  'chia_wallet.register_remote_coins': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Register Remote Coins' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm registering these remote coins.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Register' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
      { name: 'coin_ids', label: () => i18n._(/* i18n */ { id: 'Coin Ids' }), type: 'json', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_registerRemoteCoins',
      label: () => i18n._(/* i18n */ { id: 'Register Remote Coins' }),
      description: () => i18n._(/* i18n */ { id: 'Registers a list of remote coin IDs with a remote wallet.' }),
    },
  },

  // ── Misc with dialog ───────────────────────────────────────────────────────
  'chia_wallet.did_get_information_needed_for_recovery': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Get DID Recovery Information' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this query.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Query' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_getDIDInformationNeededForRecovery',
      label: () => i18n._(/* i18n */ { id: 'Get Information Needed For DID Recovery' }),
    },
  },

  'daemon.get_public_key': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Get Public Key' }),
    message: () => i18n._(/* i18n */ { id: 'An app is requesting access to a wallet public key.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Share' }),
    params: [
      { name: 'fingerprint', label: () => i18n._(/* i18n */ { id: 'Fingerprint' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_getPublicKey',
      label: () => i18n._(/* i18n */ { id: 'Get public key' }),
      description: () => i18n._(/* i18n */ { id: 'Requests a master public key from your wallet' }),
    },
  },

  // ── Read-only stubs for dapp-callable RPCs without dialog UI ───────────────
  // Reads short-circuit at the innocuous/balance capability check before the
  // dialog renderer, so these never prompt. `params` still acts as the dapp
  // allowlist.
  'chia_wallet.get_wallets': {
    params: [
      {
        name: 'include_data',
        label: () => i18n._(/* i18n */ { id: 'Include Wallet Metadata' }),
        type: 'bool',
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getWallets',
      label: () => i18n._(/* i18n */ { id: 'Get Wallets' }),
      description: () =>
        i18n._(/* i18n */ { id: 'Requests a complete listing of the wallets associated with the current wallet key' }),
      transformResponse: (data) => data.wallets ?? [],
    },
  },

  'chia_wallet.get_transaction': {
    params: [
      {
        name: 'transaction_id',
        label: () => i18n._(/* i18n */ { id: 'Transaction Id' }),
        type: 'text',
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getTransaction',
      label: () => i18n._(/* i18n */ { id: 'Get Transaction' }),
      description: () => i18n._(/* i18n */ { id: 'Requests details for a specific transaction' }),
      transformResponse: (data) => data.transaction,
    },
  },

  'chia_wallet.get_wallet_balance': {
    params: [
      {
        name: 'wallet_id',
        label: () => i18n._(/* i18n */ { id: 'Wallet Id' }),
        type: 'text',
        isOptional: true,
        hide: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getWalletBalance',
      label: () => i18n._(/* i18n */ { id: 'Get Wallet Balance' }),
      description: () =>
        i18n._(
          /* i18n */ { id: 'Requests the asset balance for a specific wallet associated with the current wallet key' },
        ),
      defaults: { wallet_id: 1 },
      transformResponse: (data) => data.walletBalance,
    },
  },

  'chia_wallet.get_wallet_balances': {
    params: [
      {
        name: 'wallet_ids',
        label: () => i18n._(/* i18n */ { id: 'Wallet Ids' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getWalletBalances',
      label: () => i18n._(/* i18n */ { id: 'Get Wallet Balances' }),
      description: () =>
        i18n._(
          /* i18n */ {
            id: 'Requests the asset balances for specific wallets associated with the current wallet key',
          },
        ),
      transformResponse: (data) => data.walletBalances,
    },
  },

  'chia_wallet.get_coin_records_by_names': {
    params: [
      {
        name: 'names',
        label: () => i18n._(/* i18n */ { id: 'Names (coin ids)' }),
        type: 'json',
        dappAllowed: true,
      },
      {
        name: 'start_height',
        label: () => i18n._(/* i18n */ { id: 'Start Height' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'end_height',
        label: () => i18n._(/* i18n */ { id: 'End Height' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'include_spent_coins',
        label: () => i18n._(/* i18n */ { id: 'Include Spent Coins' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'allow_unsynced',
        label: () => i18n._(/* i18n */ { id: 'Allow Unsynced' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getCoinRecordsByNames',
      label: () => i18n._(/* i18n */ { id: 'Get Coin Records by Name' }),
      description: () =>
        i18n._(/* i18n */ { id: "Requests the status of a list of coin records from the Wallet's coin store." }),
      defaults: { include_spent_coins: true },
    },
  },

  'chia_wallet.select_coins': {
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
      { name: 'amount', label: () => i18n._(/* i18n */ { id: 'Amount' }), type: 'mojo-to-xch', dappAllowed: true },
      {
        name: 'min_coin_amount',
        label: () => i18n._(/* i18n */ { id: 'Min Coin Amount' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'max_coin_amount',
        label: () => i18n._(/* i18n */ { id: 'Max Coin Amount' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'excluded_coin_amounts',
        label: () => i18n._(/* i18n */ { id: 'Excluded Coin Amounts' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'excluded_coin_ids',
        label: () => i18n._(/* i18n */ { id: 'Excluded Coin IDs' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'allow_unsynced',
        label: () => i18n._(/* i18n */ { id: 'Allow Unsynced' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_selectCoins',
      label: () => i18n._(/* i18n */ { id: 'Select Coins' }),
      description: () => i18n._(/* i18n */ { id: 'Selects coins to be spent from a specific wallet' }),
      defaults: { wallet_id: 1 },
    },
  },

  'chia_wallet.get_spendable_coins': {
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
      {
        name: 'min_coin_amount',
        label: () => i18n._(/* i18n */ { id: 'Min Coin Amount' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'max_coin_amount',
        label: () => i18n._(/* i18n */ { id: 'Max Coin Amount' }),
        type: 'mojo-to-xch',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'excluded_coin_amounts',
        label: () => i18n._(/* i18n */ { id: 'Excluded Coin Amounts' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'excluded_coin_ids',
        label: () => i18n._(/* i18n */ { id: 'Excluded Coin IDs' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getSpendableCoins',
      label: () => i18n._(/* i18n */ { id: 'Get Spendable Coins' }),
      description: () => i18n._(/* i18n */ { id: 'Requests spendable coins for a specific wallet' }),
      requiresSync: true,
      defaults: { wallet_id: 1 },
    },
  },

  'chia_wallet.verify_signature': {
    params: [
      { name: 'message', label: () => i18n._(/* i18n */ { id: 'Message' }), type: 'text', dappAllowed: true },
      { name: 'pubkey', label: () => i18n._(/* i18n */ { id: 'Public Key' }), type: 'text', dappAllowed: true },
      { name: 'signature', label: () => i18n._(/* i18n */ { id: 'Signature' }), type: 'text', dappAllowed: true },
      {
        name: 'address',
        label: () => i18n._(/* i18n */ { id: 'Address' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'signing_mode',
        label: () => i18n._(/* i18n */ { id: 'Signing Mode' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_verifySignature',
      label: () => i18n._(/* i18n */ { id: 'Verify Signature' }),
      description: () => i18n._(/* i18n */ { id: 'Requests the verification status for a digital signature' }),
    },
  },

  'chia_wallet.get_next_address': {
    params: [
      {
        name: 'wallet_id',
        label: () => i18n._(/* i18n */ { id: 'Wallet Id' }),
        type: 'text',
        isOptional: true,
        hide: true,
        dappAllowed: true,
      },
      {
        name: 'new_address',
        label: () => i18n._(/* i18n */ { id: 'New Address' }),
        type: 'bool',
        isOptional: true,
        hide: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getNextAddress',
      label: () => i18n._(/* i18n */ { id: 'Get Next Address' }),
      description: () =>
        i18n._(/* i18n */ { id: 'Requests a new receive address associated with the current wallet key' }),
      defaults: { wallet_id: 1, new_address: true },
      transformResponse: (data) => data.address,
      // No daemon `get_current_address` RPC; alias routes to `get_next_address` with new_address=false.
      aliases: [
        {
          wcCommand: 'chia_getCurrentAddress',
          label: () => i18n._(/* i18n */ { id: 'Get Current Address' }),
          description: () =>
            i18n._(/* i18n */ { id: 'Requests the current receive address associated with the current wallet key' }),
          defaults: { new_address: false },
        },
      ],
    },
  },

  'chia_wallet.get_sync_status': {
    params: [],
    dapp: {
      wcCommand: 'chia_getSyncStatus',
      label: () => i18n._(/* i18n */ { id: 'Get Wallet Sync Status' }),
      description: () => i18n._(/* i18n */ { id: 'Requests the syncing status of current wallet' }),
    },
  },

  'chia_wallet.get_full_node_peer_count': {
    params: [],
    dapp: {
      wcCommand: 'chia_getFullNodePeerCount',
      label: () => i18n._(/* i18n */ { id: 'Get Full Node Peer Count' }),
      description: () =>
        i18n._(/* i18n */ { id: 'Requests the number of full node peers currently connected to the wallet' }),
      transformResponse: (data) => data.peerCount,
    },
  },

  'chia_wallet.get_height_info': {
    params: [
      {
        name: 'use_peak_height',
        label: () => i18n._(/* i18n */ { id: 'Use peak height' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getHeightInfo',
      label: () => i18n._(/* i18n */ { id: 'Get Height Info' }),
      description: () =>
        i18n._(
          /* i18n */ {
            id: 'Returns wallet height, latest block timestamp, and related fields. Optional usePeakHeight uses the chain tip while syncing.',
          },
        ),
      defaults: { use_peak_height: false },
      // Match legacy api-react shape: surface only the height-related fields,
      // null-fill the optional ones so dapps can rely on the keys existing.
      transformResponse: (data) => ({
        height: data.height,
        latestTimestamp: data.latestTimestamp,
        isTransactionBlock: data.isTransactionBlock ?? null,
        prevTransactionBlockHeight: data.prevTransactionBlockHeight ?? null,
      }),
    },
  },

  'chia_wallet.get_puzzle_and_solution': {
    params: [
      { name: 'coin_name', label: () => i18n._(/* i18n */ { id: 'Coin name' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_getPuzzleAndSolution',
      label: () => i18n._(/* i18n */ { id: 'Get puzzle and solution' }),
      description: () =>
        i18n._(/* i18n */ { id: 'Fetches the puzzle reveal and solution for a spent coin (hex strings).' }),
    },
  },

  'chia_wallet.get_all_offers': {
    params: [
      {
        name: 'start',
        label: () => i18n._(/* i18n */ { id: 'Start' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'end',
        label: () => i18n._(/* i18n */ { id: 'End' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'sort_key',
        label: () => i18n._(/* i18n */ { id: 'Start Key' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'reverse',
        label: () => i18n._(/* i18n */ { id: 'Reverse' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'include_my_offers',
        label: () => i18n._(/* i18n */ { id: 'Include My Offers' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'include_taken_offers',
        label: () => i18n._(/* i18n */ { id: 'Include Taken Offers' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getAllOffers',
      label: () => i18n._(/* i18n */ { id: 'Get all Offers' }),
      description: () =>
        i18n._(/* i18n */ { id: 'Requests a complete listing of the offers associated with the current wallet key' }),
      // Legacy `getAllOffers` zipped `tradeRecords` with `offers` (when
      // present) under `_offerData` per record. Mirror that.
      transformResponse: (data) => {
        const tradeRecords = (data.tradeRecords as unknown[]) ?? [];
        const offers = data.offers as unknown[] | undefined;
        if (!offers) return tradeRecords;
        return tradeRecords.map((record, i) => ({
          ...(record as Record<string, unknown>),
          _offerData: offers[i],
        }));
      },
    },
  },

  'chia_wallet.get_offers_count': {
    params: [],
    dapp: {
      wcCommand: 'chia_getOffersCount',
      label: () => i18n._(/* i18n */ { id: 'Get Offers Count' }),
      description: () =>
        i18n._(/* i18n */ { id: 'Requests the number of offers associated with the current wallet key' }),
    },
  },

  'chia_wallet.check_offer_validity': {
    params: [{ name: 'offer', label: () => i18n._(/* i18n */ { id: 'Offer Data' }), type: 'text', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_checkOfferValidity',
      label: () => i18n._(/* i18n */ { id: 'Check Offer Validity' }),
      description: () => i18n._(/* i18n */ { id: 'Requests the validity status of a specific offer' }),
    },
  },

  'chia_wallet.get_offer_summary': {
    params: [
      { name: 'offer_data', label: () => i18n._(/* i18n */ { id: 'Offer Data' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_getOfferSummary',
      label: () => i18n._(/* i18n */ { id: 'Get Offer Summary' }),
      description: () => i18n._(/* i18n */ { id: 'Requests the summarized details of a specific offer' }),
    },
  },

  'chia_wallet.get_offer_data': {
    params: [{ name: 'offer_id', label: () => i18n._(/* i18n */ { id: 'Offer Id' }), type: 'text', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_getOfferData',
      label: () => i18n._(/* i18n */ { id: 'Get Offer Data' }),
      description: () => i18n._(/* i18n */ { id: 'Requests the raw offer data for a specific offer' }),
    },
  },

  'chia_wallet.get_offer_record': {
    params: [{ name: 'offer_id', label: () => i18n._(/* i18n */ { id: 'Offer Id' }), type: 'text', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_getOfferRecord',
      label: () => i18n._(/* i18n */ { id: 'Get Offer Record' }),
      description: () => i18n._(/* i18n */ { id: 'Requests the details for a specific offer' }),
    },
  },

  'chia_wallet.cat_asset_id_to_name': {
    params: [{ name: 'asset_id', label: () => i18n._(/* i18n */ { id: 'Asset Id' }), type: 'text', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_getCATWalletInfo',
      label: () => i18n._(/* i18n */ { id: 'Get CAT Wallet Info' }),
    },
  },

  'chia_wallet.cat_get_asset_id': {
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_getCATAssetId',
      label: () => i18n._(/* i18n */ { id: 'Get CAT Asset Id' }),
      description: () => i18n._(/* i18n */ { id: 'Requests the CAT asset ID for a specific CAT wallet' }),
      transformResponse: (data) => data.assetId,
    },
  },

  'chia_wallet.nft_get_nfts': {
    params: [
      { name: 'wallet_ids', label: () => i18n._(/* i18n */ { id: 'Wallet Ids' }), type: 'json', dappAllowed: true },
      {
        name: 'num',
        label: () => i18n._(/* i18n */ { id: 'Number of NFTs' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'start_index',
        label: () => i18n._(/* i18n */ { id: 'Start Index' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getNFTs',
      label: () => i18n._(/* i18n */ { id: 'Get NFTs' }),
      description: () =>
        i18n._(
          /* i18n */ {
            id: 'Requests a full or paginated listing of NFTs associated with one or more wallets associated with the current wallet key',
          },
        ),
    },
  },

  'chia_wallet.nft_get_info': {
    params: [{ name: 'coin_id', label: () => i18n._(/* i18n */ { id: 'Coin Id' }), type: 'text', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_getNFTInfo',
      label: () => i18n._(/* i18n */ { id: 'Get NFT Info' }),
      description: () => i18n._(/* i18n */ { id: 'Requests details for a specific NFT' }),
    },
  },

  'chia_wallet.nft_count_nfts': {
    params: [
      { name: 'wallet_ids', label: () => i18n._(/* i18n */ { id: 'Wallet Ids' }), type: 'json', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_getNFTsCount',
      label: () => i18n._(/* i18n */ { id: 'Get NFTs Count' }),
      description: () =>
        i18n._(
          /* i18n */ {
            id: 'Requests the number of NFTs associated with one or more wallets associated with the current wallet key',
          },
        ),
    },
  },

  'chia_wallet.nft_get_wallets_with_dids': {
    params: [],
    dapp: {
      wcCommand: 'chia_getNFTWalletsWithDIDs',
      label: () => i18n._(/* i18n */ { id: 'Get NFT Wallets with DIDs' }),
      transformResponse: (data) => data.nftWallets,
    },
  },

  'chia_wallet.did_get_current_coin_info': {
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_getDIDCurrentCoinInfo',
      label: () => i18n._(/* i18n */ { id: 'Get DID Current Coin Info' }),
    },
  },

  'chia_wallet.did_get_did': {
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_getDID',
      label: () => i18n._(/* i18n */ { id: 'Get DID' }),
    },
  },

  'chia_wallet.did_get_info': {
    params: [{ name: 'coin_id', label: () => i18n._(/* i18n */ { id: 'Coin Id' }), type: 'text', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_getDIDInfo',
      label: () => i18n._(/* i18n */ { id: 'Get DID Info' }),
    },
  },

  'chia_wallet.did_get_metadata': {
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_getDIDMetadata',
      label: () => i18n._(/* i18n */ { id: 'Get DID Metadata' }),
    },
  },

  'chia_wallet.did_get_pubkey': {
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_getDIDPubkey',
      label: () => i18n._(/* i18n */ { id: 'Get DID Public Key' }),
    },
  },

  'chia_wallet.did_get_recovery_list': {
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_getDIDRecoveryList',
      label: () => i18n._(/* i18n */ { id: 'Get DID Recovery List' }),
    },
  },

  'chia_wallet.did_get_wallet_name': {
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text', dappAllowed: true },
    ],
    dapp: {
      wcCommand: 'chia_getDIDName',
      label: () => i18n._(/* i18n */ { id: 'Get DID Name' }),
    },
  },

  'chia_wallet.vc_get_list': {
    params: [],
    dapp: {
      wcCommand: 'chia_getVCList',
      label: () => i18n._(/* i18n */ { id: 'Get All Verifiable Credentials' }),
    },
  },

  'chia_wallet.vc_get': {
    params: [{ name: 'vc_id', label: () => i18n._(/* i18n */ { id: 'Launcher Id' }), type: 'text', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_getVC',
      label: () => i18n._(/* i18n */ { id: 'Get Verifiable Credential' }),
      transformResponse: (data) => data.vcRecord,
    },
  },

  'chia_wallet.vc_get_proofs_for_root': {
    params: [{ name: 'root', label: () => i18n._(/* i18n */ { id: 'Proofs Hash' }), type: 'text', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_getProofsForRoot',
      label: () => i18n._(/* i18n */ { id: 'Get Proofs For Root Hash' }),
    },
  },

  'chia_data_layer.get_keys': {
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true },
      {
        name: 'root_hash',
        label: () => i18n._(/* i18n */ { id: 'Root Hash' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'page',
        label: () => i18n._(/* i18n */ { id: 'Page' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'max_page_size',
        label: () => i18n._(/* i18n */ { id: 'Max page size' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getKeys',
      label: () => i18n._(/* i18n */ { id: 'Get Keys' }),
    },
  },

  'chia_data_layer.get_keys_values': {
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true },
      {
        name: 'root_hash',
        label: () => i18n._(/* i18n */ { id: 'Root Hash' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'page',
        label: () => i18n._(/* i18n */ { id: 'Page' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'max_page_size',
        label: () => i18n._(/* i18n */ { id: 'Max page size' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getKeysValues',
      label: () => i18n._(/* i18n */ { id: 'Get Keys Values' }),
    },
  },

  'chia_data_layer.get_kv_diff': {
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true },
      { name: 'hash_1', label: () => i18n._(/* i18n */ { id: 'Hash 1' }), type: 'text', dappAllowed: true },
      { name: 'hash_2', label: () => i18n._(/* i18n */ { id: 'Hash 2' }), type: 'text', dappAllowed: true },
      {
        name: 'page',
        label: () => i18n._(/* i18n */ { id: 'Page' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'max_page_size',
        label: () => i18n._(/* i18n */ { id: 'Max page size' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getKvDiff',
      label: () => i18n._(/* i18n */ { id: 'Get Kv Diff' }),
    },
  },

  'chia_data_layer.get_local_root': {
    params: [{ name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_getLocalRoot',
      label: () => i18n._(/* i18n */ { id: 'Get Local Root' }),
    },
  },

  'chia_data_layer.get_mirrors': {
    params: [{ name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_getMirrors',
      label: () => i18n._(/* i18n */ { id: 'Get Mirrors' }),
    },
  },

  'chia_data_layer.get_owned_stores': {
    params: [],
    dapp: {
      wcCommand: 'chia_getOwnedStores',
      label: () => i18n._(/* i18n */ { id: 'Get Owned Stores' }),
    },
  },

  'chia_data_layer.get_root': {
    params: [{ name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_getRoot',
      label: () => i18n._(/* i18n */ { id: 'Get Root' }),
    },
  },

  'chia_data_layer.get_roots': {
    params: [{ name: 'ids', label: () => i18n._(/* i18n */ { id: 'Store Ids' }), type: 'json', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_getRoots',
      label: () => i18n._(/* i18n */ { id: 'Get Roots' }),
    },
  },

  'chia_data_layer.get_root_history': {
    params: [{ name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_getRootHistory',
      label: () => i18n._(/* i18n */ { id: 'Get Root History' }),
    },
  },

  'chia_data_layer.get_sync_status': {
    params: [{ name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true }],
    dapp: {
      wcCommand: 'chia_getDataLayerSyncStatus',
      label: () => i18n._(/* i18n */ { id: 'Get DataLayer Sync Status' }),
    },
  },

  'chia_data_layer.get_value': {
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text', dappAllowed: true },
      { name: 'key', label: () => i18n._(/* i18n */ { id: 'Key' }), type: 'text', dappAllowed: true },
      {
        name: 'root_hash',
        label: () => i18n._(/* i18n */ { id: 'Root Hash' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getValue',
      label: () => i18n._(/* i18n */ { id: 'Get Value' }),
    },
  },

  'daemon.get_wallet_addresses': {
    params: [
      {
        name: 'fingerprints',
        label: () => i18n._(/* i18n */ { id: 'Fingerprints' }),
        type: 'json',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'index',
        label: () => i18n._(/* i18n */ { id: 'Index' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'count',
        label: () => i18n._(/* i18n */ { id: 'Count' }),
        type: 'text',
        isOptional: true,
        dappAllowed: true,
      },
      {
        name: 'non_observer_derivation',
        label: () => i18n._(/* i18n */ { id: 'Non Observer Derivation' }),
        type: 'bool',
        isOptional: true,
        dappAllowed: true,
      },
    ],
    dapp: {
      wcCommand: 'chia_getWalletAddresses',
      label: () => i18n._(/* i18n */ { id: 'Get wallet addresses for one or more wallet keys' }),
      transformResponse: (data) => data.walletAddresses,
    },
  },
};

// Reverse index: wcCommand → ns + per-wc effective fields. Duplicate
// `wcCommand` values throw at startup.
export type WcEntry = {
  nsCommand: string;
  schema: CommandSchema;
  /** schema.dapp.defaults + alias overrides (alias wins). */
  defaults?: Record<string, unknown>;
  label?: () => string;
  description?: () => string;
  requiresSync: boolean;
  handlerKey?: string;
};

function mergeDefaults(
  base?: Record<string, unknown>,
  override?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!base && !override) return undefined;
  return { ...(base ?? {}), ...(override ?? {}) };
}

const BY_WC_COMMAND = (() => {
  const map = new Map<string, WcEntry>();
  const register = (wcCommand: string, entry: WcEntry) => {
    const existing = map.get(wcCommand);
    if (existing) {
      throw new Error(
        `commandRegistry: duplicate wcCommand "${wcCommand}" on ${entry.nsCommand} and ${existing.nsCommand}`,
      );
    }
    map.set(wcCommand, entry);
  };
  for (const [nsCommand, schema] of Object.entries(SCHEMAS)) {
    if (schema.dapp) {
      register(schema.dapp.wcCommand, {
        nsCommand,
        schema,
        defaults: schema.dapp.defaults,
        label: schema.dapp.label,
        description: schema.dapp.description,
        requiresSync: schema.dapp.requiresSync === true,
        handlerKey: schema.dapp.handlerKey,
      });
      for (const alias of schema.dapp.aliases ?? []) {
        register(alias.wcCommand, {
          nsCommand,
          schema,
          defaults: mergeDefaults(schema.dapp.defaults, alias.defaults),
          label: alias.label ?? schema.dapp.label,
          description: alias.description ?? schema.dapp.description,
          requiresSync: alias.requiresSync ?? schema.dapp.requiresSync === true,
          handlerKey: schema.dapp.handlerKey,
        });
      }
    }
  }
  return map;
})();

export function getCommandSchema(nsCommand: string): CommandSchema {
  return SCHEMAS[nsCommand] ?? FALLBACK;
}

export function getCommandByWc(wcCommand: string): WcEntry | undefined {
  return BY_WC_COMMAND.get(wcCommand);
}

export function isDappAllowedWcCommand(wcCommand: string): boolean {
  return BY_WC_COMMAND.has(wcCommand);
}

// Renderer never supplies a destination — main resolves it from the registry
// so a dapp can't claim services it wasn't granted. Handler-routed commands
// throw here; callers must check `entry.handlerKey` first.
export function resolveDispatch(wcCommand: string): { destination: string; command: string; nsCommand: string } {
  const entry = BY_WC_COMMAND.get(wcCommand);
  if (!entry) {
    throw new WcError(`unknown wc command: ${wcCommand}`, WcErrorCode.METHOD_NOT_FOUND);
  }
  const { nsCommand } = entry;
  if (nsCommand.startsWith(`${RENDERER_NAMESPACE}.`)) {
    throw new WcError(`wc command not dispatchable: ${wcCommand}`, WcErrorCode.METHOD_NOT_FOUND);
  }
  const dotIdx = nsCommand.indexOf('.');
  if (dotIdx < 0) {
    throw new WcError(`malformed schema key: ${nsCommand}`, WcErrorCode.INTERNAL_ERROR);
  }
  return {
    destination: nsCommand.slice(0, dotIdx),
    command: nsCommand.slice(dotIdx + 1),
    nsCommand,
  };
}

// Allowlist check: throws if a key isn't in `params` or doesn't have
// `dappAllowed: true`. Fails closed.
export function validateDappParams(wcCommand: string, data: Record<string, unknown>): void {
  const entry = BY_WC_COMMAND.get(wcCommand);
  if (!entry) {
    throw new WcError(`unknown wc command: ${wcCommand}`, WcErrorCode.METHOD_NOT_FOUND);
  }
  const allowed = new Map<string, ParamSchema>();
  for (const p of entry.schema.params) allowed.set(p.name, p);
  for (const key of Object.keys(data)) {
    const param = allowed.get(key);
    if (!param) {
      throw new WcError(`param not allowed for dapp: ${key}`, WcErrorCode.INVALID_PARAMS);
    }
    if (param.dappAllowed !== true) {
      throw new WcError(`param is UI-only: ${key}`, WcErrorCode.INVALID_PARAMS);
    }
  }
}

// IPC boundary — the `string[]` annotation is a suggestion, not a guarantee.
export function filterRequestedCommands(requestedCommands: unknown): {
  allowed: string[];
  rejected: string[];
} {
  const allowed: string[] = [];
  const rejected: string[] = [];
  if (!Array.isArray(requestedCommands)) {
    return { allowed, rejected };
  }
  const seen = new Set<string>();
  for (const command of requestedCommands) {
    if (typeof command === 'string' && command && !seen.has(command)) {
      seen.add(command);
      if (BY_WC_COMMAND.has(command)) {
        allowed.push(command);
      } else {
        rejected.push(command);
      }
    }
  }
  return { allowed, rejected };
}

export function bareWcCommand(wcCommand: string): string {
  return wcCommand.startsWith('chia_') ? wcCommand.slice('chia_'.length) : wcCommand;
}

export type CommandMetadata = {
  wcCommand: string;
  label?: string;
  description?: string;
  requiresSync: boolean;
};

// Re-resolves locale strings on every call so locale switches propagate.
export function commandsMetadata(): CommandMetadata[] {
  const out: CommandMetadata[] = [];
  for (const [wcCommand, entry] of BY_WC_COMMAND) {
    out.push({
      wcCommand,
      label: entry.label?.(),
      description: entry.description?.(),
      requiresSync: entry.requiresSync,
    });
  }
  return out;
}

// Keyed by wcCommand (not nsCommand) so aliases pin different defaults.
export function applyDefaults(wcCommand: string, snakeData: Record<string, unknown>): Record<string, unknown> {
  const entry = BY_WC_COMMAND.get(wcCommand);
  if (!entry?.defaults) return snakeData;
  const next = { ...snakeData };
  for (const [key, value] of Object.entries(entry.defaults)) {
    if (next[key] === undefined) {
      next[key] = value;
    }
  }
  return next;
}

/** For tests iterating the full table. */
export const SCHEMA_COMMANDS: readonly string[] = Object.keys(SCHEMAS);

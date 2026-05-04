// Single source of truth for which RPCs exist, which are dapp-callable
// (entries with `wcCommand`), and what the Confirm dialog renders. Keys are
// `<destination>.<command>` (split on `.`); param names are snake_case to
// match the wire envelope. wcCommand uses wire form `chia_<name>` so it
// matches `proposal.methods`, `pair.commands`, and `pair.bypass` directly.
import { i18n } from '../../config/locales';
import NotificationType from '../../constants/NotificationType';
import { buildCreateOfferDisplay, buildTakeOfferDisplay, lookupCat } from '../utils/dappEnrichment';
import type { EnrichmentDisplay } from '../utils/dappEnrichment';

export type ParamType = 'text' | 'mojo-to-xch' | 'mojo-to-cat' | 'bool' | 'json';

type ParamSchemaBase = {
  name: string;
  label: () => string;
};

export type ParamSchema = ParamSchemaBase &
  (
    | { type: 'text' }
    | { type: 'mojo-to-xch' }
    /** Renders as `<amount> <symbol>`; symbol fetched via wallet id at `data[symbolFrom]`. */
    | { type: 'mojo-to-cat'; symbolFrom: string }
    | { type: 'bool' }
    | { type: 'json' }
  );

// String fields are functions to defer i18n resolution past startup so
// locale switches take effect on the next read.
export type CommandSchema = {
  /** Wire form `chia_<name>`. Absence = UI-only command. */
  wcCommand?: string;
  label?: () => string;
  description?: () => string;
  /** Renderer waits for wallet sync before dispatching (set on spend-class commands). */
  requiresSync?: boolean;
  title?: () => string;
  message?: () => string;
  confirmLabel?: () => string;
  destructive?: boolean;
  params: ParamSchema[];
  /** Snake_case fields filled at dispatch when the dapp omits them. */
  defaults?: Record<string, unknown>;
  /** Optional daemon-RPC enrichment for offer summaries, CAT names, etc. */
  enrich?: (data: Record<string, unknown>) => Promise<EnrichmentDisplay>;
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

// Anything under `chia_app.*` is renderer-handled and rejected at dispatch.
const RENDERER_NAMESPACE = 'chia_app';

const SCHEMAS: Record<string, CommandSchema> = {
  // Renderer-handled meta-commands. Listed so the WC SDK accepts them at
  // session approval; main dispatch rejects them (they have no daemon RPC).
  'chia_app.request_permissions': {
    wcCommand: 'chia_requestPermissions',
    label: () => i18n._(/* i18n */ { id: 'Request Permissions' }),
    description: () => i18n._(/* i18n */ { id: 'App is requesting permission to execute these commands' }),
    params: [],
  },
  'chia_app.show_notification': {
    wcCommand: 'chia_showNotification',
    label: () => i18n._(/* i18n */ { id: 'Show Notification' }),
    description: () => i18n._(/* i18n */ { id: 'Show notification with offer or general announcement' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Notification' }),
    message: () => i18n._(/* i18n */ { id: 'This app wants to show you a notification.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Show' }),
    // Param names are camelCase (not snake_case like daemon-bound entries) —
    // show_notification never reaches the daemon, so we render the dapp's
    // payload verbatim, matching what `buildShowNotification` reads.
    params: [
      { name: 'type', label: () => i18n._(/* i18n */ { id: 'Type' }), type: 'text' },
      { name: 'message', label: () => i18n._(/* i18n */ { id: 'Message' }), type: 'text' },
      { name: 'url', label: () => i18n._(/* i18n */ { id: 'URL' }), type: 'text' },
      { name: 'allFingerprints', label: () => i18n._(/* i18n */ { id: 'All Wallets' }), type: 'bool' },
    ],
    enrich: async (data) => {
      // Render the offer summary so the user sees what's offered, not base64.
      if (data.type === NotificationType.OFFER && typeof data.offerData === 'string' && data.offerData) {
        const offer = await buildTakeOfferDisplay({ offer: data.offerData });
        return offer ? { offer } : {};
      }
      return {};
    },
  },

  // ── Wallet (mutating) ──────────────────────────────────────────────────────
  'chia_wallet.send_transaction': {
    wcCommand: 'chia_sendTransaction',
    defaults: { wallet_id: 1 },
    requiresSync: true,
    label: () => i18n._(/* i18n */ { id: 'Send Transaction' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Send Transaction' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this blockchain transaction.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'address', label: () => i18n._(/* i18n */ { id: 'Address' }), type: 'text' },
      { name: 'amount', label: () => i18n._(/* i18n */ { id: 'Amount' }), type: 'mojo-to-xch' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
      { name: 'puzzle_decorator', label: () => i18n._(/* i18n */ { id: 'Puzzle Decorator' }), type: 'json' },
    ],
  },

  'chia_wallet.cat_spend': {
    wcCommand: 'chia_spendCAT',
    requiresSync: true,
    label: () => i18n._(/* i18n */ { id: 'Spend CAT' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm CAT Spend' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this CAT spend.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text' },
      { name: 'address', label: () => i18n._(/* i18n */ { id: 'Address' }), type: 'text' },
      {
        name: 'amount',
        label: () => i18n._(/* i18n */ { id: 'Amount' }),
        type: 'mojo-to-cat',
        symbolFrom: 'wallet_id',
      },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
      { name: 'memos', label: () => i18n._(/* i18n */ { id: 'Memos' }), type: 'json' },
    ],
    enrich: async (data) => {
      const walletId = data.wallet_id;
      if (walletId === undefined || walletId === null) return {};
      const cat = await lookupCat(walletId as number | string);
      return cat ? { cat } : {};
    },
  },

  'chia_wallet.nft_transfer_nft': {
    wcCommand: 'chia_transferNFT',
    label: () => i18n._(/* i18n */ { id: 'Transfer NFT' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm NFT Transfer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this NFT transfer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Transfer' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text' },
      { name: 'nft_coin_ids', label: () => i18n._(/* i18n */ { id: 'NFT Coin Ids' }), type: 'json' },
      { name: 'target_address', label: () => i18n._(/* i18n */ { id: 'Target Address' }), type: 'text' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
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
    wcCommand: 'chia_cancelOffer',
    label: () => i18n._(/* i18n */ { id: 'Cancel Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this offer cancellation.' }),
    destructive: true,
    params: [
      { name: 'trade_id', label: () => i18n._(/* i18n */ { id: 'Trade Id' }), type: 'text' },
      { name: 'secure', label: () => i18n._(/* i18n */ { id: 'Secure' }), type: 'bool' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  'chia_wallet.create_offer_for_ids': {
    wcCommand: 'chia_createOfferForIds',
    label: () => i18n._(/* i18n */ { id: 'Create Offer for Ids' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Create Offer' }),
    message: () =>
      i18n._(
        /* i18n */ {
          id: 'Please carefully review and confirm this offer creation. When creating an offer, any assets that are being offered will be locked and unavailable until the offer is accepted or cancelled, resulting in your spendable balance changing.',
        },
      ),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      { name: 'driver_dict', label: () => i18n._(/* i18n */ { id: 'Driver Dict' }), type: 'json' },
      { name: 'validate_only', label: () => i18n._(/* i18n */ { id: 'Validate Only' }), type: 'bool' },
      {
        name: 'disable_json_formatting',
        label: () => i18n._(/* i18n */ { id: 'Disable JSON Formatting' }),
        type: 'bool',
      },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
      { name: 'extra_conditions', label: () => i18n._(/* i18n */ { id: 'Extra Conditions' }), type: 'json' },
      { name: 'coin_ids', label: () => i18n._(/* i18n */ { id: 'Coin Ids' }), type: 'json' },
      { name: 'allow_unsynced', label: () => i18n._(/* i18n */ { id: 'Allow Unsynced' }), type: 'bool' },
    ],
    enrich: async (data) => {
      const offer = await buildCreateOfferDisplay(data);
      return offer ? { offer } : {};
    },
  },

  'chia_wallet.take_offer': {
    wcCommand: 'chia_takeOffer',
    label: () => i18n._(/* i18n */ { id: 'Take Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this offer acceptance.' }),
    params: [
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
      { name: 'extra_conditions', label: () => i18n._(/* i18n */ { id: 'Extra Conditions' }), type: 'json' },
    ],
    enrich: async (data) => {
      const offer = await buildTakeOfferDisplay(data);
      return offer ? { offer } : {};
    },
  },

  'chia_wallet.sign_message_by_address': {
    wcCommand: 'chia_signMessageByAddress',
    label: () => i18n._(/* i18n */ { id: 'Sign Message by Address' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Sign Message' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to sign this message?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Sign' }),
    params: [
      { name: 'address', label: () => i18n._(/* i18n */ { id: 'Address' }), type: 'text' },
      { name: 'message', label: () => i18n._(/* i18n */ { id: 'Message' }), type: 'text' },
      { name: 'is_hex', label: () => i18n._(/* i18n */ { id: 'Hex Encoded' }), type: 'bool' },
      { name: 'safe_mode', label: () => i18n._(/* i18n */ { id: 'Safe Mode' }), type: 'bool' },
    ],
  },

  'chia_wallet.sign_message_by_id': {
    wcCommand: 'chia_signMessageById',
    label: () => i18n._(/* i18n */ { id: 'Sign Message by Id' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Sign Message' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to sign this message?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Sign' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Id' }), type: 'text' },
      { name: 'message', label: () => i18n._(/* i18n */ { id: 'Message' }), type: 'text' },
      { name: 'is_hex', label: () => i18n._(/* i18n */ { id: 'Hex Encoded' }), type: 'bool' },
    ],
  },

  'chia_wallet.nft_set_nft_did': {
    wcCommand: 'chia_setNFTDID',
    label: () => i18n._(/* i18n */ { id: 'Set NFT DID' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Move NFT to DID' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to move this NFT to the specified profile?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Move' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text' },
      { name: 'nft_launcher_id', label: () => i18n._(/* i18n */ { id: 'NFT Launcher Id' }), type: 'text' },
      { name: 'nft_coin_ids', label: () => i18n._(/* i18n */ { id: 'NFT Coin Ids' }), type: 'json' },
      { name: 'did', label: () => i18n._(/* i18n */ { id: 'DID' }), type: 'text' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
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
    wcCommand: 'chia_logIn',
    label: () => i18n._(/* i18n */ { id: 'Log In' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Log In' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to switch to this wallet key?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Log In' }),
    params: [{ name: 'fingerprint', label: () => i18n._(/* i18n */ { id: 'Fingerprint' }), type: 'text' }],
  },

  // ── Transactions ───────────────────────────────────────────────────────────
  'chia_wallet.spend_clawback_coins': {
    wcCommand: 'chia_spendClawbackCoins',
    requiresSync: true,
    label: () => i18n._(/* i18n */ { id: 'Claw back or claim claw back transaction' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Clawback Spend' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this clawback spend.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'coin_ids', label: () => i18n._(/* i18n */ { id: 'Coin Ids' }), type: 'json' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  'chia_wallet.push_transactions': {
    wcCommand: 'chia_pushTransactions',
    label: () => i18n._(/* i18n */ { id: 'Push Transactions' }),
    description: () => i18n._(/* i18n */ { id: 'Push a list of transactions to the blockchain via the wallet' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Push Transactions' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm pushing this transaction bundle.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Push' }),
    params: [
      { name: 'transactions', label: () => i18n._(/* i18n */ { id: 'Transactions' }), type: 'json' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
      { name: 'push', label: () => i18n._(/* i18n */ { id: 'Push' }), type: 'bool' },
      { name: 'sign', label: () => i18n._(/* i18n */ { id: 'Sign' }), type: 'bool' },
      { name: 'allow_unsynced', label: () => i18n._(/* i18n */ { id: 'Allow Unsynced' }), type: 'bool' },
    ],
  },

  'chia_full_node.push_tx': {
    wcCommand: 'chia_pushTx',
    label: () => i18n._(/* i18n */ { id: 'Push Transaction' }),
    description: () => i18n._(/* i18n */ { id: 'Push a spend bundle (transaction) to the blockchain' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Push Transaction' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm pushing this transaction.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Push' }),
    params: [{ name: 'spend_bundle', label: () => i18n._(/* i18n */ { id: 'Spend Bundle' }), type: 'json' }],
  },

  // ── NFTs ───────────────────────────────────────────────────────────────────
  'chia_wallet.nft_mint_nft': {
    wcCommand: 'chia_mintNFT',
    label: () => i18n._(/* i18n */ { id: 'Mint NFT' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Mint NFT' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this NFT mint.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Mint' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text' },
      { name: 'royalty_address', label: () => i18n._(/* i18n */ { id: 'Royalty Address' }), type: 'text' },
      { name: 'royalty_percentage', label: () => i18n._(/* i18n */ { id: 'Royalty Percentage' }), type: 'text' },
      { name: 'target_address', label: () => i18n._(/* i18n */ { id: 'Target Address' }), type: 'text' },
      { name: 'uris', label: () => i18n._(/* i18n */ { id: 'URIs' }), type: 'json' },
      { name: 'hash', label: () => i18n._(/* i18n */ { id: 'Hash' }), type: 'text' },
      { name: 'meta_uris', label: () => i18n._(/* i18n */ { id: 'Meta URIs' }), type: 'json' },
      { name: 'meta_hash', label: () => i18n._(/* i18n */ { id: 'Meta Hash' }), type: 'text' },
      { name: 'license_uris', label: () => i18n._(/* i18n */ { id: 'License URIs' }), type: 'json' },
      { name: 'license_hash', label: () => i18n._(/* i18n */ { id: 'License Hash' }), type: 'text' },
      { name: 'edition_number', label: () => i18n._(/* i18n */ { id: 'Edition Number' }), type: 'text' },
      { name: 'edition_total', label: () => i18n._(/* i18n */ { id: 'Edition Total' }), type: 'text' },
      { name: 'did_id', label: () => i18n._(/* i18n */ { id: 'DID Id' }), type: 'text' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  'chia_wallet.nft_mint_bulk': {
    wcCommand: 'chia_mintBulk',
    label: () => i18n._(/* i18n */ { id: 'Mint Bulk' }),
    description: () => i18n._(/* i18n */ { id: 'Create a spend bundle to mint multiple NFTs' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Bulk Mint NFTs' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this bulk NFT mint.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Mint' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text' },
      { name: 'metadata_list', label: () => i18n._(/* i18n */ { id: 'Metadata List' }), type: 'json' },
      { name: 'royalty_percentage', label: () => i18n._(/* i18n */ { id: 'Royalty Percentage' }), type: 'text' },
      { name: 'royalty_address', label: () => i18n._(/* i18n */ { id: 'Royalty Address' }), type: 'text' },
      { name: 'target_list', label: () => i18n._(/* i18n */ { id: 'Target List' }), type: 'json' },
      { name: 'mint_number_start', label: () => i18n._(/* i18n */ { id: 'Mint Start Number' }), type: 'text' },
      { name: 'mint_total', label: () => i18n._(/* i18n */ { id: 'Mint Total' }), type: 'text' },
      { name: 'xch_coins', label: () => i18n._(/* i18n */ { id: 'XCH Coins' }), type: 'json' },
      { name: 'xch_change_target', label: () => i18n._(/* i18n */ { id: 'XCH Change Target' }), type: 'text' },
      { name: 'new_innerpuzhash', label: () => i18n._(/* i18n */ { id: 'New Inner Puzzle Hash' }), type: 'json' },
      { name: 'new_p_2_puzhash', label: () => i18n._(/* i18n */ { id: 'New P2 Puzzle Hash' }), type: 'text' },
      { name: 'did_coin', label: () => i18n._(/* i18n */ { id: 'DID Coin' }), type: 'json' },
      { name: 'did_lineage_parent', label: () => i18n._(/* i18n */ { id: 'DID Lineage Parent' }), type: 'text' },
      { name: 'mint_from_did', label: () => i18n._(/* i18n */ { id: 'Mint From DID' }), type: 'bool' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
      { name: 'reuse_puzhash', label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }), type: 'bool' },
    ],
  },

  // ── DIDs ───────────────────────────────────────────────────────────────────
  'chia_wallet.did_find_lost': {
    wcCommand: 'chia_findLostDID',
    label: () => i18n._(/* i18n */ { id: 'Find Lost DID' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Find Lost DID' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to recover this DID?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Recover' }),
    params: [{ name: 'coin_id', label: () => i18n._(/* i18n */ { id: 'Coin Id' }), type: 'text' }],
  },

  'chia_wallet.did_update_metadata': {
    wcCommand: 'chia_updateDIDMetadata',
    label: () => i18n._(/* i18n */ { id: 'Update DID Metadata' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Update DID Metadata' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this DID metadata update.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Update' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text' },
      { name: 'metadata', label: () => i18n._(/* i18n */ { id: 'DID Metadata' }), type: 'json' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
      { name: 'reuse_puzhash', label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }), type: 'bool' },
    ],
  },

  'chia_wallet.did_update_recovery_ids': {
    wcCommand: 'chia_updateDIDRecoveryIds',
    label: () => i18n._(/* i18n */ { id: 'Update DID Recovery Ids' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Update DID Recovery Ids' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this DID recovery list update.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Update' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text' },
      { name: 'new_list', label: () => i18n._(/* i18n */ { id: 'New Recovery List' }), type: 'json' },
      {
        name: 'num_verifications_required',
        label: () => i18n._(/* i18n */ { id: 'Verifications Required' }),
        type: 'text',
      },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
      { name: 'reuse_puzhash', label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }), type: 'bool' },
    ],
  },

  'chia_wallet.did_set_wallet_name': {
    wcCommand: 'chia_setDIDName',
    label: () => i18n._(/* i18n */ { id: 'Set DID Name' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Set DID Name' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm renaming this DID wallet.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Set' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text' },
      { name: 'name', label: () => i18n._(/* i18n */ { id: 'Name' }), type: 'text' },
    ],
  },

  // ── VCs ────────────────────────────────────────────────────────────────────
  'chia_wallet.vc_spend': {
    wcCommand: 'chia_spendVC',
    label: () => i18n._(/* i18n */ { id: 'Add Proofs To Verifiable Credential' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm VC Spend' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this verifiable credential spend.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'vc_id', label: () => i18n._(/* i18n */ { id: 'VC Id' }), type: 'text' },
      { name: 'new_puzhash', label: () => i18n._(/* i18n */ { id: 'New Puzzle Hash' }), type: 'text' },
      { name: 'new_proof_hash', label: () => i18n._(/* i18n */ { id: 'New Proof Hash' }), type: 'text' },
      {
        name: 'provider_inner_puzhash',
        label: () => i18n._(/* i18n */ { id: 'Provider Inner Puzzle Hash' }),
        type: 'text',
      },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
      { name: 'reuse_puzhash', label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }), type: 'bool' },
    ],
  },

  'chia_wallet.vc_add_proofs': {
    wcCommand: 'chia_addVCProofs',
    label: () => i18n._(/* i18n */ { id: 'Add Proofs' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Add VC Proofs' }),
    message: () =>
      i18n._(/* i18n */ { id: 'Please carefully review and confirm adding proofs to this verifiable credential.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Add' }),
    params: [{ name: 'proofs', label: () => i18n._(/* i18n */ { id: 'Proofs' }), type: 'json' }],
  },

  'chia_wallet.vc_revoke': {
    wcCommand: 'chia_revokeVC',
    label: () => i18n._(/* i18n */ { id: 'Revoke Verifiable Credential' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Revoke VC' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to revoke this verifiable credential?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Revoke' }),
    destructive: true,
    params: [
      { name: 'vc_parent_id', label: () => i18n._(/* i18n */ { id: 'Parent Coin Id' }), type: 'text' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  // ── DataLayer (mutating) ───────────────────────────────────────────────────
  'chia_data_layer.create_data_store': {
    wcCommand: 'chia_createDataStore',
    label: () => i18n._(/* i18n */ { id: 'Create DataStore' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Create DataStore' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm creating this data store.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
      { name: 'verbose', label: () => i18n._(/* i18n */ { id: 'Verbose' }), type: 'bool' },
    ],
  },

  'chia_data_layer.batch_update': {
    wcCommand: 'chia_batchUpdate',
    label: () => i18n._(/* i18n */ { id: 'Batch Update' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Update' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this data store update.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Update' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text' },
      { name: 'changelist', label: () => i18n._(/* i18n */ { id: 'Changelist' }), type: 'json' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
      { name: 'submit_on_chain', label: () => i18n._(/* i18n */ { id: 'Submit On Chain' }), type: 'bool' },
    ],
  },

  'chia_data_layer.insert': {
    wcCommand: 'chia_insert',
    label: () => i18n._(/* i18n */ { id: 'Insert' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Insert' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this data store insert.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Insert' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text' },
      { name: 'key', label: () => i18n._(/* i18n */ { id: 'Key' }), type: 'text' },
      { name: 'value', label: () => i18n._(/* i18n */ { id: 'Value' }), type: 'text' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  'chia_data_layer.delete_key': {
    wcCommand: 'chia_deleteKey',
    label: () => i18n._(/* i18n */ { id: 'Delete Key' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Delete Key' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to delete this key from the data store?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Delete' }),
    destructive: true,
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text' },
      { name: 'key', label: () => i18n._(/* i18n */ { id: 'Key' }), type: 'text' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  'chia_data_layer.add_mirror': {
    wcCommand: 'chia_addMirror',
    label: () => i18n._(/* i18n */ { id: 'Add Mirror' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Add Mirror' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm adding this mirror.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Add' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text' },
      { name: 'urls', label: () => i18n._(/* i18n */ { id: 'URLs' }), type: 'json' },
      { name: 'amount', label: () => i18n._(/* i18n */ { id: 'Amount' }), type: 'text' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  'chia_data_layer.delete_mirror': {
    wcCommand: 'chia_deleteMirror',
    label: () => i18n._(/* i18n */ { id: 'Delete Mirror' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Delete Mirror' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to delete this mirror?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Delete' }),
    destructive: true,
    params: [
      { name: 'coin_id', label: () => i18n._(/* i18n */ { id: 'Coin Id' }), type: 'text' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  'chia_data_layer.subscribe': {
    wcCommand: 'chia_subscribe',
    label: () => i18n._(/* i18n */ { id: 'Subscribe' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Subscribe' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this subscription.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Subscribe' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text' },
      { name: 'urls', label: () => i18n._(/* i18n */ { id: 'URLs' }), type: 'json' },
    ],
  },

  'chia_data_layer.unsubscribe': {
    wcCommand: 'chia_unsubscribe',
    label: () => i18n._(/* i18n */ { id: 'Unsubscribe' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Unsubscribe' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this unsubscribe.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Unsubscribe' }),
    destructive: true,
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text' },
      { name: 'retain', label: () => i18n._(/* i18n */ { id: 'Retain' }), type: 'bool' },
    ],
  },

  'chia_data_layer.remove_subscriptions': {
    wcCommand: 'chia_removeSubscriptions',
    label: () => i18n._(/* i18n */ { id: 'Remove Subscriptions' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Remove Subscriptions' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to remove these subscription URLs?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Remove' }),
    destructive: true,
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text' },
      { name: 'urls', label: () => i18n._(/* i18n */ { id: 'URLs' }), type: 'json' },
    ],
  },

  'chia_data_layer.add_missing_files': {
    wcCommand: 'chia_addMissingFiles',
    label: () => i18n._(/* i18n */ { id: 'Add Missing Files' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Add Missing Files' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm syncing missing files.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Sync' }),
    params: [
      { name: 'ids', label: () => i18n._(/* i18n */ { id: 'Store Ids' }), type: 'json' },
      { name: 'overwrite', label: () => i18n._(/* i18n */ { id: 'Overwrite' }), type: 'bool' },
      { name: 'foldername', label: () => i18n._(/* i18n */ { id: 'Folder Name' }), type: 'text' },
    ],
  },

  'chia_data_layer.check_plugins': {
    wcCommand: 'chia_checkPlugins',
    label: () => i18n._(/* i18n */ { id: 'Check Plugins' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Check Plugins' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Check' }),
    params: [],
  },

  'chia_data_layer.clear_pending_roots': {
    wcCommand: 'chia_clearPendingRoots',
    label: () => i18n._(/* i18n */ { id: 'Clear Pending Roots' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Clear Pending Roots' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to clear pending roots for this store?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Clear' }),
    destructive: true,
    params: [{ name: 'store_id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text' }],
  },

  'chia_data_layer.get_ancestors': {
    wcCommand: 'chia_getAncestors',
    label: () => i18n._(/* i18n */ { id: 'Get Ancestors' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Get Ancestors' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this query.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Query' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), type: 'text' },
      { name: 'hash', label: () => i18n._(/* i18n */ { id: 'Hash' }), type: 'text' },
    ],
  },

  'chia_data_layer.subscriptions': {
    wcCommand: 'chia_subscriptions',
    label: () => i18n._(/* i18n */ { id: 'Subscriptions' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm List Subscriptions' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this query.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Query' }),
    params: [],
  },

  'chia_data_layer.make_offer': {
    wcCommand: 'chia_makeDataLayerOffer',
    label: () => i18n._(/* i18n */ { id: 'Make DataLayer Offer' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Make DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this DataLayer offer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      { name: 'maker', label: () => i18n._(/* i18n */ { id: 'Maker' }), type: 'json' },
      { name: 'taker', label: () => i18n._(/* i18n */ { id: 'Taker' }), type: 'json' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  'chia_data_layer.take_offer': {
    wcCommand: 'chia_takeDataLayerOffer',
    label: () => i18n._(/* i18n */ { id: 'Take DataLayer Offer' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Take DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm taking this DataLayer offer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Accept' }),
    params: [
      { name: 'offer', label: () => i18n._(/* i18n */ { id: 'Offer' }), type: 'json' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  'chia_data_layer.cancel_offer': {
    wcCommand: 'chia_cancelDataLayerOffer',
    label: () => i18n._(/* i18n */ { id: 'Cancel DataLayer Offer' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Cancel DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm cancelling this DataLayer offer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Cancel' }),
    destructive: true,
    params: [
      { name: 'trade_id', label: () => i18n._(/* i18n */ { id: 'Trade Id' }), type: 'text' },
      { name: 'secure', label: () => i18n._(/* i18n */ { id: 'Secure' }), type: 'bool' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  'chia_data_layer.verify_offer': {
    wcCommand: 'chia_verifyOffer',
    label: () => i18n._(/* i18n */ { id: 'Verify Offer' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Verify DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this offer verification.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Verify' }),
    params: [
      { name: 'offer', label: () => i18n._(/* i18n */ { id: 'Offer' }), type: 'json' },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), type: 'mojo-to-xch' },
    ],
  },

  // ── Remote wallets / coin tracking ─────────────────────────────────────────
  'chia_wallet.create_new_remote_wallet': {
    wcCommand: 'chia_createNewRemoteWallet',
    label: () => i18n._(/* i18n */ { id: 'Create new Remote Wallet' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Create Remote Wallet' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm creating this remote wallet.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [{ name: 'allow_unsynced', label: () => i18n._(/* i18n */ { id: 'Allow Unsynced' }), type: 'bool' }],
  },

  'chia_wallet.register_remote_coins': {
    wcCommand: 'chia_registerRemoteCoins',
    label: () => i18n._(/* i18n */ { id: 'Register Remote Coins' }),
    description: () => i18n._(/* i18n */ { id: 'Registers a list of remote coin IDs with a remote wallet.' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Register Remote Coins' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm registering these remote coins.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Register' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text' },
      { name: 'coin_ids', label: () => i18n._(/* i18n */ { id: 'Coin Ids' }), type: 'json' },
    ],
  },

  // ── Misc with dialog ───────────────────────────────────────────────────────
  'chia_wallet.did_get_information_needed_for_recovery': {
    wcCommand: 'chia_getDIDInformationNeededForRecovery',
    label: () => i18n._(/* i18n */ { id: 'Get Information Needed For DID Recovery' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Get DID Recovery Information' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this query.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Query' }),
    params: [{ name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), type: 'text' }],
  },

  'daemon.get_public_key': {
    wcCommand: 'chia_getPublicKey',
    label: () => i18n._(/* i18n */ { id: 'Get public key' }),
    description: () => i18n._(/* i18n */ { id: 'Requests a master public key from your wallet' }),
    title: () => i18n._(/* i18n */ { id: 'Confirm Get Public Key' }),
    message: () => i18n._(/* i18n */ { id: 'An app is requesting access to a wallet public key.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Share' }),
    params: [{ name: 'fingerprint', label: () => i18n._(/* i18n */ { id: 'Fingerprint' }), type: 'text' }],
  },

  // ── Read-only stubs for dapp-callable RPCs without dialog UI ───────────────
  // Reads short-circuit at the capability check (innocuous/balance) before
  // ever reaching the dialog renderer, so these schemas never produce a
  // visible prompt. They exist solely so this table remains the single
  // source of truth for "is this RPC reachable from a paired dapp."
  'chia_wallet.get_wallets': { wcCommand: 'chia_getWallets', params: [] },
  'chia_wallet.get_transaction': { wcCommand: 'chia_getTransaction', params: [] },
  'chia_wallet.get_wallet_balance': {
    wcCommand: 'chia_getWalletBalance',
    params: [],
    defaults: { wallet_id: 1 },
  },
  'chia_wallet.get_wallet_balances': { wcCommand: 'chia_getWalletBalances', params: [] },
  'chia_wallet.get_current_address': {
    wcCommand: 'chia_getCurrentAddress',
    params: [],
    defaults: { wallet_id: 1 },
  },
  'chia_wallet.get_coin_records_by_names': {
    wcCommand: 'chia_getCoinRecordsByNames',
    params: [],
    defaults: { include_spent_coins: true },
  },
  'chia_wallet.select_coins': {
    wcCommand: 'chia_selectCoins',
    params: [],
    defaults: { wallet_id: 1 },
  },
  'chia_wallet.get_spendable_coins': {
    wcCommand: 'chia_getSpendableCoins',
    requiresSync: true,
    params: [],
    defaults: { wallet_id: 1 },
  },
  'chia_wallet.verify_signature': { wcCommand: 'chia_verifySignature', params: [] },
  'chia_wallet.get_next_address': {
    wcCommand: 'chia_getNextAddress',
    params: [],
    defaults: { wallet_id: 1, new_address: true },
  },
  'chia_wallet.get_sync_status': { wcCommand: 'chia_getSyncStatus', params: [] },
  'chia_wallet.get_height_info': {
    wcCommand: 'chia_getHeightInfo',
    params: [],
    defaults: { use_peak_height: false },
  },
  'chia_wallet.get_puzzle_and_solution': { wcCommand: 'chia_getPuzzleAndSolution', params: [] },
  'chia_wallet.get_all_offers': { wcCommand: 'chia_getAllOffers', params: [] },
  'chia_wallet.get_offers_count': { wcCommand: 'chia_getOffersCount', params: [] },
  'chia_wallet.check_offer_validity': { wcCommand: 'chia_checkOfferValidity', params: [] },
  'chia_wallet.get_offer_summary': { wcCommand: 'chia_getOfferSummary', params: [] },
  'chia_wallet.get_offer_data': { wcCommand: 'chia_getOfferData', params: [] },
  'chia_wallet.get_offer_record': { wcCommand: 'chia_getOfferRecord', params: [] },
  'chia_wallet.cat_asset_id_to_name': { wcCommand: 'chia_getCATWalletInfo', params: [] },
  'chia_wallet.cat_get_asset_id': { wcCommand: 'chia_getCATAssetId', params: [] },
  'chia_wallet.nft_get_nfts': { wcCommand: 'chia_getNFTs', params: [] },
  'chia_wallet.nft_get_info': { wcCommand: 'chia_getNFTInfo', params: [] },
  'chia_wallet.nft_count_nfts': { wcCommand: 'chia_getNFTsCount', params: [] },
  'chia_wallet.nft_get_wallets_with_dids': { wcCommand: 'chia_getNFTWalletsWithDIDs', params: [] },
  'chia_wallet.did_get_current_coin_info': { wcCommand: 'chia_getDIDCurrentCoinInfo', params: [] },
  'chia_wallet.did_get_did': { wcCommand: 'chia_getDID', params: [] },
  'chia_wallet.did_get_info': { wcCommand: 'chia_getDIDInfo', params: [] },
  'chia_wallet.did_get_metadata': { wcCommand: 'chia_getDIDMetadata', params: [] },
  'chia_wallet.did_get_pubkey': { wcCommand: 'chia_getDIDPubkey', params: [] },
  'chia_wallet.did_get_recovery_list': { wcCommand: 'chia_getDIDRecoveryList', params: [] },
  'chia_wallet.did_get_wallet_name': { wcCommand: 'chia_getDIDName', params: [] },
  'chia_wallet.vc_get_list': { wcCommand: 'chia_getVCList', params: [] },
  'chia_wallet.vc_get': { wcCommand: 'chia_getVC', params: [] },
  'chia_wallet.vc_get_proofs_for_root': { wcCommand: 'chia_getProofsForRoot', params: [] },
  'chia_data_layer.get_keys': { wcCommand: 'chia_getKeys', params: [] },
  'chia_data_layer.get_keys_values': { wcCommand: 'chia_getKeysValues', params: [] },
  'chia_data_layer.get_kv_diff': { wcCommand: 'chia_getKvDiff', params: [] },
  'chia_data_layer.get_local_root': { wcCommand: 'chia_getLocalRoot', params: [] },
  'chia_data_layer.get_mirrors': { wcCommand: 'chia_getMirrors', params: [] },
  'chia_data_layer.get_owned_stores': { wcCommand: 'chia_getOwnedStores', params: [] },
  'chia_data_layer.get_root': { wcCommand: 'chia_getRoot', params: [] },
  'chia_data_layer.get_roots': { wcCommand: 'chia_getRoots', params: [] },
  'chia_data_layer.get_root_history': { wcCommand: 'chia_getRootHistory', params: [] },
  'chia_data_layer.get_sync_status': { wcCommand: 'chia_getDataLayerSyncStatus', params: [] },
  'chia_data_layer.get_value': { wcCommand: 'chia_getValue', params: [] },
  'daemon.get_wallet_addresses': { wcCommand: 'chia_getWalletAddresses', params: [] },
};

// Reverse index: WC command (wire form) → ns command. Built once at module
// init by walking SCHEMAS. Duplicate `wcCommand` values throw at startup —
// better than mysterious dispatches landing on the wrong RPC.
const BY_WC_COMMAND = (() => {
  const map = new Map<string, { nsCommand: string; schema: CommandSchema }>();
  for (const [nsCommand, schema] of Object.entries(SCHEMAS)) {
    if (schema.wcCommand) {
      if (map.has(schema.wcCommand)) {
        throw new Error(
          `commandRegistry: duplicate wcCommand "${schema.wcCommand}" on ${nsCommand} and ${
            map.get(schema.wcCommand)!.nsCommand
          }`,
        );
      }
      map.set(schema.wcCommand, { nsCommand, schema });
    }
  }
  return map;
})();

export function getCommandSchema(nsCommand: string): CommandSchema {
  return SCHEMAS[nsCommand] ?? FALLBACK;
}

export function getCommandByWc(wcCommand: string): { nsCommand: string; schema: CommandSchema } | undefined {
  return BY_WC_COMMAND.get(wcCommand);
}

export function isDappAllowedWcCommand(wcCommand: string): boolean {
  return BY_WC_COMMAND.has(wcCommand);
}

// Returns the daemon destination + RPC name, or a structured rejection.
// The renderer never supplies a destination — main resolves it from the
// registry to keep the dapp from claiming services it wasn't granted.
export function resolveDispatch(
  wcCommand: string,
): { ok: true; destination: string; command: string; nsCommand: string } | { ok: false; reason: string } {
  const entry = BY_WC_COMMAND.get(wcCommand);
  if (!entry) {
    return { ok: false, reason: `unknown wc command: ${wcCommand}` };
  }
  const { nsCommand } = entry;
  if (nsCommand.startsWith(`${RENDERER_NAMESPACE}.`)) {
    return { ok: false, reason: `wc command not dispatchable: ${wcCommand}` };
  }
  const dotIdx = nsCommand.indexOf('.');
  if (dotIdx < 0) {
    return { ok: false, reason: `malformed schema key: ${nsCommand}` };
  }
  return {
    ok: true,
    destination: nsCommand.slice(0, dotIdx),
    command: nsCommand.slice(dotIdx + 1),
    nsCommand,
  };
}

// Defensive against non-array input — this is an IPC boundary where the
// `string[]` type annotation is just a suggestion.
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

// Re-resolves locale strings on every call so a locale switch propagates
// on the next fetch. Includes `chia_app.*` so Settings can label them.
export function commandsMetadata(): CommandMetadata[] {
  const out: CommandMetadata[] = [];
  for (const schema of Object.values(SCHEMAS)) {
    if (schema.wcCommand) {
      out.push({
        wcCommand: schema.wcCommand,
        label: schema.label?.(),
        description: schema.description?.(),
        requiresSync: schema.requiresSync === true,
      });
    }
  }
  return out;
}

// Fills missing snake_case keys; dapp-supplied values win. Returns a new object.
export function applyDefaults(nsCommand: string, snakeData: Record<string, unknown>): Record<string, unknown> {
  const schema = SCHEMAS[nsCommand];
  if (!schema?.defaults) return snakeData;
  const next = { ...snakeData };
  for (const [key, value] of Object.entries(schema.defaults)) {
    if (next[key] === undefined) {
      next[key] = value;
    }
  }
  return next;
}

/** For tests iterating the full table. */
export const SCHEMA_COMMANDS: readonly string[] = Object.keys(SCHEMAS);

/**
 * Canonical per-command schema for the Confirm dialog.
 *
 * One entry per RPC command names what the user sees: window title, body
 * message, primary button label, destructive styling, and the param rows
 * (label + how to render the value out of `data`). Optional `enrich` runs
 * daemon RPCs for commands whose dialog needs structured async data (offer
 * summaries, NFT thumbnails) — anything beyond a single-field formatter.
 *
 * The schema is the only place that defines confirmation UX per command.
 * Both prompt paths in main (dapp `dispatchAsPair` and UI `onSend`) feed the
 * same data through `renderConfirm`, which consults this table.
 *
 * Field names use snake_case to match the wire envelope sent to the daemon —
 * the same `data` is what shows up in the dialog and what crosses the socket.
 */
import { i18n } from '../../../config/locales';

import type { EnrichmentDisplay } from '../../utils/dappEnrichment';
import { buildCreateOfferDisplay, buildTakeOfferDisplay, lookupCat } from '../../utils/dappEnrichment';

/** A param renderer kind. Pure ones format from `data` synchronously; the
 *  ones declared in `dappEnrichment` (mojo-to-cat needs a daemon lookup for
 *  the symbol) run async — `renderConfirm` awaits them. */
export type ParamKind =
  | { kind: 'text' }
  | { kind: 'mojo-to-xch' }
  | { kind: 'mojo-to-cat'; symbolFrom: string }
  | { kind: 'bool' }
  /** Pretty-print arbitrary JSON (objects, arrays). For object/array
   *  WC params where the daemon RPC takes a structural value. */
  | { kind: 'json' };

export type ParamSchema = {
  /** snake_case key in `data`. */
  name: string;
  label: () => string;
  kind: ParamKind;
};

export type ConfirmSchema = {
  /** Defaults to `'Confirm'`. Omit when the dialog is generic. */
  title?: () => string;
  /** Defaults to `'Please review and confirm this action.'`. */
  message?: () => string;
  /** Defaults to `'Proceed'`. */
  confirmLabel?: () => string;
  destructive?: boolean;
  params: ParamSchema[];
  /** Optional async enrichment (daemon RPCs) for offer summaries etc. */
  enrich?: (data: Record<string, unknown>) => Promise<EnrichmentDisplay>;
};

const DEFAULT_TITLE = () => i18n._(/* i18n */ { id: 'Confirm' });
const DEFAULT_MESSAGE = () => i18n._(/* i18n */ { id: 'Please review and confirm this action.' });
const DEFAULT_CONFIRM_LABEL = () => i18n._(/* i18n */ { id: 'Proceed' });

/** Title / message / confirmLabel resolved with the fallback. The `default`
 *  triple is what the dialog should show when a schema doesn't specify. */
export function resolveTexts(schema: ConfirmSchema | undefined): {
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

const FALLBACK: ConfirmSchema = {
  params: [],
};

const SCHEMAS: Record<string, ConfirmSchema> = {
  'chia_wallet.send_transaction': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Send Transaction' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this blockchain transaction.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'address', label: () => i18n._(/* i18n */ { id: 'Address' }), kind: { kind: 'text' } },
      { name: 'amount', label: () => i18n._(/* i18n */ { id: 'Amount' }), kind: { kind: 'mojo-to-xch' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
      { name: 'puzzle_decorator', label: () => i18n._(/* i18n */ { id: 'Puzzle Decorator' }), kind: { kind: 'json' } },
    ],
  },

  'chia_wallet.cat_spend': {
    title: () => i18n._(/* i18n */ { id: 'Confirm CAT Spend' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this CAT spend.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), kind: { kind: 'text' } },
      // WC's `spendCAT` declares `address` (not `inner_address`). The dialog
      // shows what the dapp actually sent on the wire — main doesn't rename.
      { name: 'address', label: () => i18n._(/* i18n */ { id: 'Address' }), kind: { kind: 'text' } },
      {
        name: 'amount',
        label: () => i18n._(/* i18n */ { id: 'Amount' }),
        kind: { kind: 'mojo-to-cat', symbolFrom: 'wallet_id' },
      },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
      { name: 'memos', label: () => i18n._(/* i18n */ { id: 'Memos' }), kind: { kind: 'json' } },
    ],
    // The wallet-id → CAT info lookup also drives the `display.cat`
    // chip/icon styling (revocable badge), so resolve it once here too.
    enrich: async (data) => {
      const walletId = data.wallet_id;
      if (walletId === undefined || walletId === null) return {};
      const cat = await lookupCat(walletId as number | string);
      return cat ? { cat } : {};
    },
  },

  'chia_wallet.nft_transfer_nft': {
    title: () => i18n._(/* i18n */ { id: 'Confirm NFT Transfer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this NFT transfer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Transfer' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), kind: { kind: 'text' } },
      { name: 'nft_coin_ids', label: () => i18n._(/* i18n */ { id: 'NFT Coin Ids' }), kind: { kind: 'json' } },
      { name: 'target_address', label: () => i18n._(/* i18n */ { id: 'Target Address' }), kind: { kind: 'text' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_wallet.nft_transfer_bulk': {
    title: () => i18n._(/* i18n */ { id: 'Confirm NFT Transfer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this NFT transfer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Transfer' }),
    params: [
      { name: 'nft_coin_list', label: () => i18n._(/* i18n */ { id: 'NFT Coin List' }), kind: { kind: 'json' } },
      { name: 'target_address', label: () => i18n._(/* i18n */ { id: 'Target Address' }), kind: { kind: 'text' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_wallet.cancel_offer': {
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this offer cancellation.' }),
    destructive: true,
    params: [
      { name: 'trade_id', label: () => i18n._(/* i18n */ { id: 'Trade Id' }), kind: { kind: 'text' } },
      { name: 'secure', label: () => i18n._(/* i18n */ { id: 'Secure' }), kind: { kind: 'bool' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
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
    // The `offer` param is rendered via `enrich` below (offered/requested
    // breakdown with NFT thumbnails) — too rich for a flat row. Other
    // structural params follow the WC curation.
    params: [
      { name: 'driver_dict', label: () => i18n._(/* i18n */ { id: 'Driver Dict' }), kind: { kind: 'json' } },
      { name: 'validate_only', label: () => i18n._(/* i18n */ { id: 'Validate Only' }), kind: { kind: 'bool' } },
      {
        name: 'disable_json_formatting',
        label: () => i18n._(/* i18n */ { id: 'Disable JSON Formatting' }),
        kind: { kind: 'bool' },
      },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
      {
        name: 'extra_conditions',
        label: () => i18n._(/* i18n */ { id: 'Extra Conditions' }),
        kind: { kind: 'json' },
      },
      { name: 'coin_ids', label: () => i18n._(/* i18n */ { id: 'Coin Ids' }), kind: { kind: 'json' } },
    ],
    enrich: async (data) => {
      const offer = await buildCreateOfferDisplay(data);
      return offer ? { offer } : {};
    },
  },

  'chia_wallet.take_offer': {
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this offer acceptance.' }),
    params: [
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
      {
        name: 'extra_conditions',
        label: () => i18n._(/* i18n */ { id: 'Extra Conditions' }),
        kind: { kind: 'json' },
      },
    ],
    enrich: async (data) => {
      const offer = await buildTakeOfferDisplay(data);
      return offer ? { offer } : {};
    },
  },

  'chia_wallet.sign_message_by_address': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Sign Message' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to sign this message?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Sign' }),
    params: [
      { name: 'address', label: () => i18n._(/* i18n */ { id: 'Address' }), kind: { kind: 'text' } },
      { name: 'message', label: () => i18n._(/* i18n */ { id: 'Message' }), kind: { kind: 'text' } },
      { name: 'is_hex', label: () => i18n._(/* i18n */ { id: 'Hex Encoded' }), kind: { kind: 'bool' } },
      { name: 'safe_mode', label: () => i18n._(/* i18n */ { id: 'Safe Mode' }), kind: { kind: 'bool' } },
    ],
  },

  'chia_wallet.sign_message_by_id': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Sign Message' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to sign this message?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Sign' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Id' }), kind: { kind: 'text' } },
      { name: 'message', label: () => i18n._(/* i18n */ { id: 'Message' }), kind: { kind: 'text' } },
      { name: 'is_hex', label: () => i18n._(/* i18n */ { id: 'Hex Encoded' }), kind: { kind: 'bool' } },
    ],
  },

  'chia_wallet.nft_set_nft_did': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Move NFT to DID' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to move this NFT to the specified profile?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Move' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), kind: { kind: 'text' } },
      { name: 'nft_launcher_id', label: () => i18n._(/* i18n */ { id: 'NFT Launcher Id' }), kind: { kind: 'text' } },
      { name: 'nft_coin_ids', label: () => i18n._(/* i18n */ { id: 'NFT Coin Ids' }), kind: { kind: 'json' } },
      // WC's `setNFTDID` declares `did` (not `did_id`) — show what the dapp
      // actually sent.
      { name: 'did', label: () => i18n._(/* i18n */ { id: 'DID' }), kind: { kind: 'text' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_wallet.nft_set_did_bulk': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Move NFTs to DID' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to move these NFTs to the specified profile?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Move' }),
    params: [
      { name: 'nft_coin_list', label: () => i18n._(/* i18n */ { id: 'NFT Coin List' }), kind: { kind: 'json' } },
      { name: 'did_id', label: () => i18n._(/* i18n */ { id: 'DID' }), kind: { kind: 'text' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_wallet.set_auto_claim': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Set Auto Claim' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to set auto claim?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Set' }),
    params: [
      { name: 'enabled', label: () => i18n._(/* i18n */ { id: 'Enabled' }), kind: { kind: 'bool' } },
      { name: 'tx_fee', label: () => i18n._(/* i18n */ { id: 'Transaction Fee' }), kind: { kind: 'mojo-to-xch' } },
      { name: 'min_amount', label: () => i18n._(/* i18n */ { id: 'Min Amount' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_wallet.create_new_wallet': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Create New Wallet' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to create a new wallet?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      { name: 'wallet_name', label: () => i18n._(/* i18n */ { id: 'Name' }), kind: { kind: 'text' } },
      { name: 'wallet_type', label: () => i18n._(/* i18n */ { id: 'Type' }), kind: { kind: 'text' } },
      { name: 'asset_id', label: () => i18n._(/* i18n */ { id: 'Asset ID' }), kind: { kind: 'text' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_wallet.delete_key': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Delete Wallet' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to delete this wallet?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Delete' }),
    destructive: true,
    params: [{ name: 'fingerprint', label: () => i18n._(/* i18n */ { id: 'Fingerprint' }), kind: { kind: 'text' } }],
  },

  'chia_wallet.set_payout_instructions': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Set Payout Instructions' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to set payout instructions?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Set' }),
    params: [
      {
        name: 'payout_instructions',
        label: () => i18n._(/* i18n */ { id: 'Payout Instructions' }),
        kind: { kind: 'text' },
      },
    ],
  },

  'chia_harvester.delete_plot': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Delete Plot' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Delete' }),
    destructive: true,
    params: [{ name: 'filename', label: () => i18n._(/* i18n */ { id: 'Filename' }), kind: { kind: 'text' } }],
  },

  'chia_harvester.add_plot_directory': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Add Plot Directory' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Add' }),
    params: [{ name: 'dirname', label: () => i18n._(/* i18n */ { id: 'Directory' }), kind: { kind: 'text' } }],
  },

  'chia_harvester.remove_plot_directory': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Remove Plot Directory' }),
    destructive: true,
    params: [{ name: 'dirname', label: () => i18n._(/* i18n */ { id: 'Directory' }), kind: { kind: 'text' } }],
  },

  'chia_full_node.open_connection': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Open Connection' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to open a connection to the specified node?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Connect' }),
    params: [
      { name: 'host', label: () => i18n._(/* i18n */ { id: 'Host' }), kind: { kind: 'text' } },
      { name: 'port', label: () => i18n._(/* i18n */ { id: 'Port' }), kind: { kind: 'text' } },
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
      {
        name: 'payout_instructions',
        label: () => i18n._(/* i18n */ { id: 'Payout Instructions' }),
        kind: { kind: 'text' },
      },
    ],
  },

  'daemon.stop_plotting': {
    confirmLabel: () => i18n._(/* i18n */ { id: 'Stop' }),
    destructive: true,
    params: [],
  },

  // ── login / fingerprint switch ──────────────────────────────────────────────
  'chia_wallet.log_in': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Log In' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to switch to this wallet key?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Log In' }),
    params: [{ name: 'fingerprint', label: () => i18n._(/* i18n */ { id: 'Fingerprint' }), kind: { kind: 'text' } }],
  },

  // ── transactions ────────────────────────────────────────────────────────────
  'chia_wallet.spend_clawback_coins': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Clawback Spend' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this clawback spend.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'coin_ids', label: () => i18n._(/* i18n */ { id: 'Coin Ids' }), kind: { kind: 'json' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_wallet.push_transactions': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Push Transactions' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm pushing this transaction bundle.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Push' }),
    params: [
      { name: 'transactions', label: () => i18n._(/* i18n */ { id: 'Transactions' }), kind: { kind: 'json' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
      { name: 'push', label: () => i18n._(/* i18n */ { id: 'Push' }), kind: { kind: 'bool' } },
      { name: 'sign', label: () => i18n._(/* i18n */ { id: 'Sign' }), kind: { kind: 'bool' } },
    ],
  },

  'chia_full_node.push_tx': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Push Transaction' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm pushing this transaction.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Push' }),
    params: [
      { name: 'spend_bundle', label: () => i18n._(/* i18n */ { id: 'Spend Bundle' }), kind: { kind: 'json' } },
    ],
  },

  // ── NFTs ────────────────────────────────────────────────────────────────────
  'chia_wallet.nft_mint_nft': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Mint NFT' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this NFT mint.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Mint' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), kind: { kind: 'text' } },
      { name: 'royalty_address', label: () => i18n._(/* i18n */ { id: 'Royalty Address' }), kind: { kind: 'text' } },
      {
        name: 'royalty_percentage',
        label: () => i18n._(/* i18n */ { id: 'Royalty Percentage' }),
        kind: { kind: 'text' },
      },
      { name: 'target_address', label: () => i18n._(/* i18n */ { id: 'Target Address' }), kind: { kind: 'text' } },
      { name: 'uris', label: () => i18n._(/* i18n */ { id: 'URIs' }), kind: { kind: 'json' } },
      { name: 'hash', label: () => i18n._(/* i18n */ { id: 'Hash' }), kind: { kind: 'text' } },
      { name: 'meta_uris', label: () => i18n._(/* i18n */ { id: 'Meta URIs' }), kind: { kind: 'json' } },
      { name: 'meta_hash', label: () => i18n._(/* i18n */ { id: 'Meta Hash' }), kind: { kind: 'text' } },
      { name: 'license_uris', label: () => i18n._(/* i18n */ { id: 'License URIs' }), kind: { kind: 'json' } },
      { name: 'license_hash', label: () => i18n._(/* i18n */ { id: 'License Hash' }), kind: { kind: 'text' } },
      { name: 'edition_number', label: () => i18n._(/* i18n */ { id: 'Edition Number' }), kind: { kind: 'text' } },
      { name: 'edition_total', label: () => i18n._(/* i18n */ { id: 'Edition Total' }), kind: { kind: 'text' } },
      { name: 'did_id', label: () => i18n._(/* i18n */ { id: 'DID Id' }), kind: { kind: 'text' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_wallet.nft_mint_bulk': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Bulk Mint NFTs' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this bulk NFT mint.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Mint' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), kind: { kind: 'text' } },
      { name: 'metadata_list', label: () => i18n._(/* i18n */ { id: 'Metadata List' }), kind: { kind: 'json' } },
      {
        name: 'royalty_percentage',
        label: () => i18n._(/* i18n */ { id: 'Royalty Percentage' }),
        kind: { kind: 'text' },
      },
      { name: 'royalty_address', label: () => i18n._(/* i18n */ { id: 'Royalty Address' }), kind: { kind: 'text' } },
      { name: 'target_list', label: () => i18n._(/* i18n */ { id: 'Target List' }), kind: { kind: 'json' } },
      {
        name: 'mint_number_start',
        label: () => i18n._(/* i18n */ { id: 'Mint Start Number' }),
        kind: { kind: 'text' },
      },
      { name: 'mint_total', label: () => i18n._(/* i18n */ { id: 'Mint Total' }), kind: { kind: 'text' } },
      { name: 'mint_from_did', label: () => i18n._(/* i18n */ { id: 'Mint From DID' }), kind: { kind: 'bool' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  // ── DIDs ────────────────────────────────────────────────────────────────────
  'chia_wallet.did_find_lost': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Find Lost DID' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to recover this DID?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Recover' }),
    params: [{ name: 'coin_id', label: () => i18n._(/* i18n */ { id: 'Coin Id' }), kind: { kind: 'text' } }],
  },

  'chia_wallet.did_update_metadata': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Update DID Metadata' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this DID metadata update.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Update' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), kind: { kind: 'text' } },
      { name: 'metadata', label: () => i18n._(/* i18n */ { id: 'DID Metadata' }), kind: { kind: 'json' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
      { name: 'reuse_puzhash', label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }), kind: { kind: 'bool' } },
    ],
  },

  'chia_wallet.did_update_recovery_ids': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Update DID Recovery Ids' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this DID recovery list update.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Update' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), kind: { kind: 'text' } },
      { name: 'new_list', label: () => i18n._(/* i18n */ { id: 'New Recovery List' }), kind: { kind: 'json' } },
      {
        name: 'num_verifications_required',
        label: () => i18n._(/* i18n */ { id: 'Verifications Required' }),
        kind: { kind: 'text' },
      },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
      { name: 'reuse_puzhash', label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }), kind: { kind: 'bool' } },
    ],
  },

  'chia_wallet.did_set_wallet_name': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Set DID Name' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm renaming this DID wallet.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Set' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), kind: { kind: 'text' } },
      { name: 'name', label: () => i18n._(/* i18n */ { id: 'Name' }), kind: { kind: 'text' } },
    ],
  },

  // ── VCs ─────────────────────────────────────────────────────────────────────
  'chia_wallet.vc_spend': {
    title: () => i18n._(/* i18n */ { id: 'Confirm VC Spend' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this verifiable credential spend.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Send' }),
    params: [
      { name: 'vc_id', label: () => i18n._(/* i18n */ { id: 'VC Id' }), kind: { kind: 'text' } },
      { name: 'new_puzhash', label: () => i18n._(/* i18n */ { id: 'New Puzzle Hash' }), kind: { kind: 'text' } },
      { name: 'new_proof_hash', label: () => i18n._(/* i18n */ { id: 'New Proof Hash' }), kind: { kind: 'text' } },
      {
        name: 'provider_inner_puzhash',
        label: () => i18n._(/* i18n */ { id: 'Provider Inner Puzzle Hash' }),
        kind: { kind: 'text' },
      },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
      { name: 'reuse_puzhash', label: () => i18n._(/* i18n */ { id: 'Reuse Puzzle Hash' }), kind: { kind: 'bool' } },
    ],
  },

  'chia_wallet.vc_add_proofs': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Add VC Proofs' }),
    message: () =>
      i18n._(/* i18n */ { id: 'Please carefully review and confirm adding proofs to this verifiable credential.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Add' }),
    params: [{ name: 'proofs', label: () => i18n._(/* i18n */ { id: 'Proofs' }), kind: { kind: 'json' } }],
  },

  'chia_wallet.vc_revoke': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Revoke VC' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to revoke this verifiable credential?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Revoke' }),
    destructive: true,
    params: [
      { name: 'vc_parent_id', label: () => i18n._(/* i18n */ { id: 'Parent Coin Id' }), kind: { kind: 'text' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  // ── DataLayer (mutating) ────────────────────────────────────────────────────
  'chia_data_layer.create_data_store': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Create DataStore' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm creating this data store.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
      { name: 'verbose', label: () => i18n._(/* i18n */ { id: 'Verbose' }), kind: { kind: 'bool' } },
    ],
  },

  'chia_data_layer.batch_update': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Update' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this data store update.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Update' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), kind: { kind: 'text' } },
      { name: 'changelist', label: () => i18n._(/* i18n */ { id: 'Changelist' }), kind: { kind: 'json' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
      { name: 'submit_on_chain', label: () => i18n._(/* i18n */ { id: 'Submit On Chain' }), kind: { kind: 'bool' } },
    ],
  },

  'chia_data_layer.insert': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Insert' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this data store insert.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Insert' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), kind: { kind: 'text' } },
      { name: 'key', label: () => i18n._(/* i18n */ { id: 'Key' }), kind: { kind: 'text' } },
      { name: 'value', label: () => i18n._(/* i18n */ { id: 'Value' }), kind: { kind: 'text' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_data_layer.delete_key': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Delete Key' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to delete this key from the data store?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Delete' }),
    destructive: true,
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), kind: { kind: 'text' } },
      { name: 'key', label: () => i18n._(/* i18n */ { id: 'Key' }), kind: { kind: 'text' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_data_layer.add_mirror': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Add Mirror' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm adding this mirror.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Add' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), kind: { kind: 'text' } },
      { name: 'urls', label: () => i18n._(/* i18n */ { id: 'URLs' }), kind: { kind: 'json' } },
      { name: 'amount', label: () => i18n._(/* i18n */ { id: 'Amount' }), kind: { kind: 'text' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_data_layer.delete_mirror': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Delete Mirror' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to delete this mirror?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Delete' }),
    destructive: true,
    params: [
      { name: 'coin_id', label: () => i18n._(/* i18n */ { id: 'Coin Id' }), kind: { kind: 'text' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_data_layer.subscribe': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Subscribe' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this subscription.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Subscribe' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), kind: { kind: 'text' } },
      { name: 'urls', label: () => i18n._(/* i18n */ { id: 'URLs' }), kind: { kind: 'json' } },
    ],
  },

  'chia_data_layer.unsubscribe': {
    title: () => i18n._(/* i18n */ { id: 'Confirm DataStore Unsubscribe' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this unsubscribe.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Unsubscribe' }),
    destructive: true,
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), kind: { kind: 'text' } },
      { name: 'retain', label: () => i18n._(/* i18n */ { id: 'Retain' }), kind: { kind: 'bool' } },
    ],
  },

  'chia_data_layer.remove_subscriptions': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Remove Subscriptions' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to remove these subscription URLs?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Remove' }),
    destructive: true,
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), kind: { kind: 'text' } },
      { name: 'urls', label: () => i18n._(/* i18n */ { id: 'URLs' }), kind: { kind: 'json' } },
    ],
  },

  'chia_data_layer.add_missing_files': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Add Missing Files' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm syncing missing files.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Sync' }),
    params: [
      { name: 'ids', label: () => i18n._(/* i18n */ { id: 'Store Ids' }), kind: { kind: 'json' } },
      { name: 'overwrite', label: () => i18n._(/* i18n */ { id: 'Overwrite' }), kind: { kind: 'bool' } },
      { name: 'foldername', label: () => i18n._(/* i18n */ { id: 'Folder Name' }), kind: { kind: 'text' } },
    ],
  },

  'chia_data_layer.check_plugins': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Check Plugins' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Check' }),
    params: [],
  },

  'chia_data_layer.clear_pending_roots': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Clear Pending Roots' }),
    message: () => i18n._(/* i18n */ { id: 'Are you sure you want to clear pending roots for this store?' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Clear' }),
    destructive: true,
    params: [{ name: 'store_id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), kind: { kind: 'text' } }],
  },

  'chia_data_layer.get_ancestors': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Get Ancestors' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this query.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Query' }),
    params: [
      { name: 'id', label: () => i18n._(/* i18n */ { id: 'Store Id' }), kind: { kind: 'text' } },
      { name: 'hash', label: () => i18n._(/* i18n */ { id: 'Hash' }), kind: { kind: 'text' } },
    ],
  },

  'chia_data_layer.subscriptions': {
    title: () => i18n._(/* i18n */ { id: 'Confirm List Subscriptions' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this query.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Query' }),
    params: [],
  },

  'chia_data_layer.make_offer': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Make DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm this DataLayer offer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    params: [
      { name: 'maker', label: () => i18n._(/* i18n */ { id: 'Maker' }), kind: { kind: 'json' } },
      { name: 'taker', label: () => i18n._(/* i18n */ { id: 'Taker' }), kind: { kind: 'json' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_data_layer.take_offer': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Take DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm taking this DataLayer offer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Accept' }),
    params: [
      { name: 'offer', label: () => i18n._(/* i18n */ { id: 'Offer' }), kind: { kind: 'json' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_data_layer.cancel_offer': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Cancel DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm cancelling this DataLayer offer.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Cancel' }),
    destructive: true,
    params: [
      { name: 'trade_id', label: () => i18n._(/* i18n */ { id: 'Trade Id' }), kind: { kind: 'text' } },
      { name: 'secure', label: () => i18n._(/* i18n */ { id: 'Secure' }), kind: { kind: 'bool' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  'chia_data_layer.verify_offer': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Verify DataLayer Offer' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this offer verification.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Verify' }),
    params: [
      { name: 'offer', label: () => i18n._(/* i18n */ { id: 'Offer' }), kind: { kind: 'json' } },
      { name: 'fee', label: () => i18n._(/* i18n */ { id: 'Fee' }), kind: { kind: 'mojo-to-xch' } },
    ],
  },

  // ── Remote wallets / coin tracking ──────────────────────────────────────────
  'chia_wallet.create_new_remote_wallet': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Create Remote Wallet' }),
    message: () => i18n._(/* i18n */ { id: 'Please carefully review and confirm creating this remote wallet.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Create' }),
    // WC's `createNewRemoteWallet` declares no fee/name — only an
    // `allowUnsynced` toggle. Reflect what the dapp actually sends.
    params: [
      { name: 'allow_unsynced', label: () => i18n._(/* i18n */ { id: 'Allow Unsynced' }), kind: { kind: 'bool' } },
    ],
  },

  'chia_wallet.register_remote_coins': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Register Remote Coins' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm registering these remote coins.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Register' }),
    params: [
      { name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), kind: { kind: 'text' } },
      { name: 'coin_ids', label: () => i18n._(/* i18n */ { id: 'Coin Ids' }), kind: { kind: 'json' } },
    ],
  },

  // ── Misc missing schemas ────────────────────────────────────────────────────
  'chia_wallet.did_get_information_needed_for_recovery': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Get DID Recovery Information' }),
    message: () => i18n._(/* i18n */ { id: 'Please review and confirm this query.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Query' }),
    params: [{ name: 'wallet_id', label: () => i18n._(/* i18n */ { id: 'Wallet Id' }), kind: { kind: 'text' } }],
  },

  'daemon.get_public_key': {
    title: () => i18n._(/* i18n */ { id: 'Confirm Get Public Key' }),
    message: () => i18n._(/* i18n */ { id: 'An app is requesting access to a wallet public key.' }),
    confirmLabel: () => i18n._(/* i18n */ { id: 'Share' }),
    params: [{ name: 'fingerprint', label: () => i18n._(/* i18n */ { id: 'Fingerprint' }), kind: { kind: 'text' } }],
  },
};

export function getConfirmSchema(command: string): ConfirmSchema {
  return SCHEMAS[command] ?? FALLBACK;
}

// Exported for tests so they can iterate the full table without having to
// know each command name.
export const SCHEMA_COMMANDS: readonly string[] = Object.keys(SCHEMAS);

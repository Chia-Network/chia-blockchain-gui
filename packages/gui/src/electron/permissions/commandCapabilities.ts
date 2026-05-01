import AllowedCommands from '../constants/AllowedCommands';

import type { CommandClassification } from './types';

const UI_ALLOWED = new Set<string>(AllowedCommands);

const BALANCE_COMMANDS = new Set([
  'chia_wallet.get_wallet_balance',
  'chia_wallet.get_wallet_balances',
]);

// Read-only / state-creating commands that the user can opt into via the
// Innocuous capability grant. Not auto-silent for pair principals — the user
// has to explicitly tick the Innocuous bundle in the Pair dialog.
//
// Everything in this list must also be in `AllowedCommands.ts` (verified
// below) — these are silent for the UI principal too.
const INNOCUOUS_COMMANDS = new Set([
  // Wallet / account info reads
  'chia_wallet.get_wallets',
  'chia_wallet.get_next_address',
  'chia_wallet.get_logged_in_fingerprint',
  'chia_wallet.get_network_info',
  'chia_wallet.get_sync_status',
  'chia_wallet.get_current_derivation_index',
  'chia_wallet.get_auto_claim',
  'chia_wallet.get_notifications',
  // Coin & blockchain reads
  'chia_wallet.get_coin_records_by_names',
  'chia_wallet.get_spendable_coins',
  'chia_wallet.select_coins',
  'chia_wallet.get_height_info',
  'chia_wallet.get_puzzle_and_solution',
  'chia_wallet.get_timestamp_for_height',
  // Transaction reads
  'chia_wallet.get_transaction',
  'chia_wallet.get_transactions',
  'chia_wallet.get_transaction_count',
  'chia_wallet.get_transaction_memo',
  'chia_wallet.get_farmed_amount',
  // Offer reads
  'chia_wallet.get_offer',
  'chia_wallet.get_offer_summary',
  'chia_wallet.check_offer_validity',
  'chia_wallet.get_offers_count',
  'chia_wallet.get_all_offers',
  // CAT info
  'chia_wallet.cat_get_asset_id',
  'chia_wallet.cat_get_name',
  'chia_wallet.cat_asset_id_to_name',
  'chia_wallet.get_cat_list',
  'chia_wallet.get_stray_cats',
  // NFT reads
  'chia_wallet.nft_count_nfts',
  'chia_wallet.nft_get_nfts',
  'chia_wallet.nft_get_info',
  'chia_wallet.nft_get_wallet_did',
  'chia_wallet.nft_get_wallets_with_dids',
  'chia_wallet.nft_calculate_royalties',
  // VC reads
  'chia_wallet.vc_get',
  'chia_wallet.vc_get_list',
  'chia_wallet.vc_get_proofs_for_root',
  // DID reads
  'chia_wallet.did_get_did',
  'chia_wallet.did_get_info',
  'chia_wallet.did_get_metadata',
  'chia_wallet.did_get_pubkey',
  'chia_wallet.did_get_recovery_list',
  'chia_wallet.did_get_information_needed_for_recovery',
  'chia_wallet.did_get_current_coin_info',
  'chia_wallet.did_get_wallet_name',
  // Pool wallet status
  'chia_wallet.pw_status',
  // Verification + ping (no key access)
  'chia_wallet.verify_signature',
  'chia_wallet.ping',
  // State-creating but non-fund-moving
  'chia_wallet.register_remote_coins',
  'chia_wallet.create_new_wallet',
  'chia_wallet.create_new_remote_wallet',
]);

// Build-time invariant: every innocuous command (that's also a UI-allowed
// command) really exists in AllowedCommands. The wallet-create commands
// aren't in AllowedCommands, that's expected — they're not silent for UI.
INNOCUOUS_COMMANDS.forEach((cmd) => {
  if (cmd === 'chia_wallet.create_new_wallet' || cmd === 'chia_wallet.create_new_remote_wallet') return;
  if (!UI_ALLOWED.has(cmd)) {
    throw new Error(
      `INNOCUOUS_COMMANDS contains '${cmd}' but it is not in AllowedCommands.ts. ` +
        'Read-style innocuous commands must be UI-allowed too.',
    );
  }
});

export function isUiAllowed(command: string): boolean {
  return UI_ALLOWED.has(command);
}

export function isBalanceCommand(command: string): boolean {
  return BALANCE_COMMANDS.has(command);
}

// Sum the XCH mojos the user is giving up in a `create_offer_for_ids` offer.
function extractOfferXchOutflow(payload: Record<string, unknown>): number | undefined {
  const offer = payload?.offer;
  if (!offer || typeof offer !== 'object') return undefined;

  let xchOut = 0;
  for (const [key, raw] of Object.entries(offer as Record<string, unknown>)) {
    const amount = Number(raw);
    if (!Number.isFinite(amount)) continue;
    if (amount <= 0) continue;
    const isXch = key === '1' || key === 'xch';
    if (!isXch) return undefined;
    xchOut += amount;
  }
  return xchOut;
}

export function classifyCommand(command: string): CommandClassification {
  if (INNOCUOUS_COMMANDS.has(command)) {
    return { kind: 'capability', capability: 'innocuous' };
  }

  switch (command) {
    case 'chia_wallet.send_transaction':
      return { kind: 'capability', capability: 'spend', amountField: 'amount', feeField: 'fee' };

    case 'chia_wallet.cat_spend':
      return { kind: 'capability', capability: 'spend' };

    case 'chia_wallet.nft_transfer_nft':
    case 'chia_wallet.nft_transfer_bulk':
    case 'chia_wallet.nft_set_nft_did':
    case 'chia_wallet.nft_set_did_bulk':
      return { kind: 'capability', capability: 'spend' };

    case 'chia_wallet.create_offer_for_ids':
      return {
        kind: 'capability',
        capability: 'offer',
        feeField: 'fee',
        amountResolver: extractOfferXchOutflow,
      };

    case 'chia_wallet.take_offer':
    case 'chia_wallet.cancel_offer':
      return { kind: 'capability', capability: 'offer' };

    case 'chia_wallet.sign_message_by_address':
    case 'chia_wallet.sign_message_by_id':
      return { kind: 'capability', capability: 'sign' };

    case 'chia_wallet.delete_key':
    case 'chia_harvester.delete_plot':
    case 'chia_harvester.add_plot_directory':
    case 'chia_harvester.remove_plot_directory':
    case 'chia_full_node.open_connection':
    case 'chia_full_node.close_connection':
    case 'chia_farmer.close_connection':
    case 'chia_farmer.set_payout_instructions':
    case 'chia_wallet.set_payout_instructions':
    case 'chia_wallet.set_auto_claim':
    case 'daemon.stop_plotting':
      return { kind: 'never' };

    default:
      return { kind: 'never' };
  }
}

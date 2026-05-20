import crypto from 'node:crypto';

import BigNumber from 'bignumber.js';
import JSONbig from 'json-bigint';

import AllowedCommands from '../constants/AllowedCommands';
import { sendDappAndAwait } from '../utils/webSocketBridge';

import type { SpendClassification } from './types';

const UI_ALLOWED = new Set<string>(AllowedCommands);

const BALANCE_COMMANDS = new Set(['chia_wallet.get_wallet_balance', 'chia_wallet.get_wallet_balances']);

// Read-only commands a dapp can opt into via the Innocuous capability grant.
// Independent of `AllowedCommands` (which governs first-party UI bypass).
const INNOCUOUS_COMMANDS = new Set([
  'chia_wallet.get_wallets',
  'chia_wallet.get_next_address',
  'chia_wallet.get_sync_status',
  'chia_wallet.get_coin_records_by_names',
  'chia_wallet.select_coins',
  'chia_wallet.get_height_info',
  'chia_wallet.get_puzzle_and_solution',
  'chia_wallet.get_timestamp_for_height',
  'chia_wallet.get_transaction',
  'chia_wallet.get_offer',
  'chia_wallet.get_offer_summary',
  'chia_wallet.check_offer_validity',
  'chia_wallet.cat_get_asset_id',
  'chia_wallet.cat_get_name',
  'chia_wallet.cat_asset_id_to_name',
  'chia_wallet.nft_get_info',
  'chia_wallet.nft_get_wallet_did',
  'chia_wallet.nft_calculate_royalties',
  'chia_wallet.vc_get',
  'chia_wallet.vc_get_proofs_for_root',
  'chia_wallet.did_get_did',
  'chia_wallet.did_get_info',
  'chia_wallet.did_get_metadata',
  'chia_wallet.did_get_pubkey',
  'chia_wallet.did_get_current_coin_info',
  'chia_wallet.did_get_wallet_name',
  'chia_wallet.pw_status',
  'chia_wallet.verify_signature',
  'chia_wallet.ping',
  'chia_wallet.create_new_remote_wallet',
  'chia_wallet.register_remote_coins',
]);

const SIGN_COMMANDS = new Set(['chia_wallet.sign_message_by_address', 'chia_wallet.sign_message_by_id']);

const SPEND_COMMANDS = new Set([
  'chia_wallet.send_transaction',
  'chia_wallet.cat_spend',
  'chia_wallet.nft_transfer_nft',
  'chia_wallet.cancel_offer',
  'chia_wallet.create_offer_for_ids',
  'chia_wallet.take_offer',
  'chia_wallet.spend_clawback_coins',
  'chia_wallet.push_transactions',
]);

export function isUiAllowed(command: string): boolean {
  return UI_ALLOWED.has(command);
}

export function isBalanceCommand(command: string): boolean {
  return BALANCE_COMMANDS.has(command);
}

export function isInnocuousCommand(command: string): boolean {
  return INNOCUOUS_COMMANDS.has(command);
}

export function isSignCommand(command: string): boolean {
  return SIGN_COMMANDS.has(command);
}

export function isSpendCommand(command: string): boolean {
  return SPEND_COMMANDS.has(command);
}

// Sum XCH mojos the maker is giving up in a `create_offer_for_ids` offer.
// Daemon convention: dict keyed by wallet id (XCH = `1`) with negative
// amounts = outflow, positive = inflow. Pure-XCH only — any CAT/NFT key
// returns undefined → prompt, since the spending cap is XCH-denominated.
function extractOfferXchOutflow(payload: Record<string, unknown>): BigNumber | undefined {
  const offer = payload?.offer;
  if (!offer || typeof offer !== 'object') return undefined;

  let xchOut = new BigNumber(0);
  for (const [key, raw] of Object.entries(offer as Record<string, unknown>)) {
    if (key !== '1') return undefined;
    let amount: BigNumber | undefined;
    try {
      amount = new BigNumber(typeof raw === 'string' ? raw : String(raw));
    } catch {
      amount = undefined;
    }
    if (amount && amount.isFinite() && amount.isLessThan(0)) {
      xchOut = xchOut.plus(amount.abs());
    }
  }
  return xchOut;
}

type OfferSummary = {
  offered?: Record<string, number | string>;
  requested?: Record<string, number | string>;
};

// Sum XCH mojos the taker would give up. Pure-XCH only on either side —
// CAT/NFT amounts return undefined → prompt. Take-fee is NOT added here;
// the spend resolver does that via `feeField`.
async function extractTakeOfferXchOutflow(payload: Record<string, unknown>): Promise<BigNumber | undefined> {
  const offer = payload?.offer;
  if (typeof offer !== 'string' || !offer) return undefined;

  let summary: OfferSummary | undefined;
  try {
    const requestId = crypto.randomBytes(32).toString('hex');
    const wire = {
      origin: 'wallet_ui',
      destination: 'chia_wallet',
      command: 'get_offer_summary',
      data: { offer },
      ack: false,
      request_id: requestId,
    };
    const json = JSONbig.stringify(wire);
    const response = (await sendDappAndAwait(requestId, json)) as {
      data?: { error?: unknown; summary?: OfferSummary };
    };
    if (response?.data?.error) return undefined;
    summary = response?.data?.summary;
  } catch {
    return undefined;
  }
  if (!summary || typeof summary !== 'object') return undefined;
  const { requested, offered } = summary;
  if (!requested || typeof requested !== 'object') return undefined;
  if (!offered || typeof offered !== 'object') return undefined;

  for (const key of Object.keys(offered)) {
    if (key !== 'xch') return undefined;
  }
  for (const key of Object.keys(requested)) {
    if (key !== 'xch') return undefined;
  }

  let xchOut = new BigNumber(0);
  const raw = (requested as { xch?: unknown }).xch;
  if (raw !== undefined) {
    try {
      const amount = new BigNumber(typeof raw === 'string' ? raw : String(raw));
      if (amount.isFinite() && amount.isGreaterThan(0)) xchOut = amount;
    } catch {
      // invalid → leave outflow at 0
    }
  }
  return xchOut;
}

export function getSpendClassification(command: string): SpendClassification | undefined {
  switch (command) {
    case 'chia_wallet.send_transaction':
      return { capability: 'spend', amountField: 'amount', feeField: 'fee' };

    case 'chia_wallet.create_offer_for_ids':
      return {
        capability: 'offer',
        feeField: 'fee',
        amountResolver: extractOfferXchOutflow,
      };

    case 'chia_wallet.take_offer':
      return {
        capability: 'offer',
        feeField: 'fee',
        amountResolver: extractTakeOfferXchOutflow,
      };

    default:
      return undefined;
  }
}

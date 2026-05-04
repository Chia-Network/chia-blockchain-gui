import BigNumber from 'bignumber.js';
import crypto from 'node:crypto';

import JSONbig from 'json-bigint';

import AllowedCommands from '../constants/AllowedCommands';
import { sendDappAndAwait } from '../utils/webSocketBridge';

import type { SpendClassification } from './types';

/*
chia_getCurrentAddress, => chia_wallet.get_next_address
chia_getWalletBalance, => chia_wallet.get_wallet_balance
chia_getWallets, => chia_wallet.get_wallets
chia_createNewRemoteWallet, => chia_wallet.create_new_remote_wallet

Channel funding (called during the handshake A–F flow):
chia_selectCoins, => chia_wallet.select_coins
chia_createOfferForIds, => chia_wallet.create_offer_for_ids - spendable
chia_walletPushTransactions, => chia_wallet.push_transactions - spendable

On-chain coin watching (driven by BlockchainPoller):
chia_registerRemoteCoins, => chia_wallet.register_remote_coins
chia_getCoinRecordsByNames, => chia_wallet.get_coin_records_by_names
chia_getHeightInfo, => chia_wallet.get_height_info

// at the end
chia_getPuzzleAndSolution, => chia_wallet.get_puzzle_and_solution
*/

const UI_ALLOWED = new Set<string>(AllowedCommands);

const BALANCE_COMMANDS = new Set([
  'chia_wallet.get_wallet_balance', // gaming
  'chia_wallet.get_wallet_balances',
]);

// Read-only commands a dapp can opt into via the Innocuous capability grant.
// Independent of `AllowedCommands` — that list governs what the first-party UI
// renderer can call silently and answers a different question.
const INNOCUOUS_COMMANDS = new Set([
  // Wallet / account info reads
  'chia_wallet.get_wallets', // gaming
  'chia_wallet.get_next_address', // gaming
  'chia_wallet.get_sync_status',
  // Coin & blockchain reads
  'chia_wallet.get_coin_records_by_names',
  'chia_wallet.select_coins', // gaming
  'chia_wallet.get_height_info', // gaming
  'chia_wallet.get_puzzle_and_solution', // gaming
  'chia_wallet.get_timestamp_for_height',
  // Transaction reads
  'chia_wallet.get_transaction',
  // Offer reads
  'chia_wallet.get_offer',
  'chia_wallet.get_offer_summary',
  'chia_wallet.check_offer_validity',
  // CAT info
  'chia_wallet.cat_get_asset_id',
  'chia_wallet.cat_get_name',
  'chia_wallet.cat_asset_id_to_name',
  // NFT reads
  'chia_wallet.nft_get_info',
  'chia_wallet.nft_get_wallet_did',
  'chia_wallet.nft_calculate_royalties',
  // VC reads
  'chia_wallet.vc_get',
  'chia_wallet.vc_get_proofs_for_root',
  // DID reads
  'chia_wallet.did_get_did',
  'chia_wallet.did_get_info',
  'chia_wallet.did_get_metadata',
  'chia_wallet.did_get_pubkey',
  'chia_wallet.did_get_current_coin_info',
  'chia_wallet.did_get_wallet_name',
  // Pool wallet status
  'chia_wallet.pw_status',
  // Verification + ping (no key access)
  'chia_wallet.verify_signature',
  'chia_wallet.ping',
  // Remote wallet/coin tracking (no funds move, no on-chain effect)
  'chia_wallet.create_new_remote_wallet', // gaming
  'chia_wallet.register_remote_coins', // gaming
]);

const SIGN_COMMANDS = new Set(['chia_wallet.sign_message_by_address', 'chia_wallet.sign_message_by_id']);

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

// Sum the XCH mojos the user is giving up in a `create_offer_for_ids` offer.
// Convention (chia daemon `trade_manager.create_offer_for_ids`): NEGATIVE
// amounts are outflow (we give), POSITIVE are inflow (we receive). The dict
// is keyed by wallet id (numeric strings ≤ 16 chars, parsed via `int(...)`)
// or asset-id hex (> 16 chars, parsed via `bytes32.from_hexstr`); see
// `wallet_request_types.CreateOfferForIDs.offer_spec`. XCH is the standard
// wallet, id `1`. Strict pure-XCH gate: any non-XCH key (CAT, NFT, mixed) on
// either side returns undefined → prompt, because the spending cap is
// denominated in XCH and can't fairly bound non-XCH transfers.
function extractOfferXchOutflow(payload: Record<string, unknown>): BigNumber | undefined {
  const offer = payload?.offer;
  if (!offer || typeof offer !== 'object') return undefined;

  let xchOut = new BigNumber(0);
  for (const [key, raw] of Object.entries(offer as Record<string, unknown>)) {
    if (key !== '1') return undefined;
    let amount: BigNumber;
    try {
      amount = new BigNumber(typeof raw === 'string' ? raw : String(raw));
    } catch {
      continue;
    }
    if (!amount.isFinite()) continue;
    if (amount.isLessThan(0)) {
      xchOut = xchOut.plus(amount.abs());
    }
    // Positive XCH is inflow (we're requesting XCH) — doesn't add to outflow.
  }
  return xchOut;
}

type OfferSummary = {
  offered?: Record<string, number | string>;
  requested?: Record<string, number | string>;
};

// Sum the XCH mojos the taker would give up. Calls `get_offer_summary` to
// parse the bech32 offer. Strict pure-XCH gate: if EITHER side of the offer
// (`offered` or `requested`) contains anything other than XCH, return
// undefined → prompt. The spending cap is denominated in XCH; a CAT/NFT
// inflow or outflow falls outside what the cap can fairly bound.
// `data.fee` (the take-tx fee) is NOT added here — the spend resolver handles
// it via `feeField`.
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
  const requested = summary.requested;
  const offered = summary.offered;
  if (!requested || typeof requested !== 'object') return undefined;
  if (!offered || typeof offered !== 'object') return undefined;

  // Either side may carry asset-id-hex (CAT) or singleton-launcher-hex (NFT)
  // keys; we want pure XCH only.
  for (const key of Object.keys(offered)) {
    if (key !== 'xch') return undefined;
  }
  for (const key of Object.keys(requested)) {
    if (key !== 'xch') return undefined;
  }

  // Daemon emits non-negative uint64 amounts; defensive skip of ≤ 0.
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

// Returns spend/offer metadata for fund-moving commands, or undefined for
// anything else. Innocuous/balance/sign and "always-prompt" commands are
// handled by their own membership checks in `permissions.ts`.
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

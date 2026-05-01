import BigNumber from 'bignumber.js';

import {
  getSpendClassification,
  isBalanceCommand,
  isInnocuousCommand,
  isSignCommand,
  isUiAllowed,
} from './commandCapabilities';
import { getPair, recordSpend } from './pairStore';
import type { CheckResult, PairGrants, PairRecord, Principal, SpendClassification } from './types';

export type CheckContext = {
  result: CheckResult;
  pair?: PairRecord;
};

const allow = (pair?: PairRecord): CheckContext => ({ result: { decision: 'allow' }, pair });
const prompt = (reason: string, pair?: PairRecord): CheckContext => ({
  result: { decision: 'prompt', reason },
  pair,
});
const deny = (reason: string, pair?: PairRecord): CheckContext => ({
  result: { decision: 'deny', reason },
  pair,
});

const ZERO = new BigNumber(0);

/**
 * Read a non-negative mojo amount from a payload field. Mojos are integer
 * counts of the smallest XCH unit; chia amounts can exceed `Number.MAX_SAFE_INTEGER`
 * (2^53), so we go through BigNumber to keep precision.
 */
function readMojos(payload: Record<string, unknown>, field: string): BigNumber | undefined {
  const raw = payload?.[field];
  if (raw === undefined || raw === null) return undefined;
  try {
    const bn = new BigNumber(typeof raw === 'string' ? raw : String(raw));
    if (!bn.isFinite() || bn.isNegative()) return undefined;
    return bn;
  } catch {
    return undefined;
  }
}

/**
 * Pure decision function. No side effects. Safe to call multiple times for the
 * same command — the budget is debited only by `consumeAllowedSpend` at the
 * actual authorization point.
 */
export function checkPermission(
  principal: Principal,
  command: string,
  payload: Record<string, unknown>,
): CheckContext {
  if (principal.kind === 'ui') {
    return isUiAllowed(command) ? allow() : prompt('requires user confirmation');
  }

  const pair = getPair(principal.topic);
  if (!pair) {
    return deny('unknown pair');
  }

  // Pair-only special gates, evaluated before any classification:
  if (isBalanceCommand(command)) {
    return pair.grants.capabilities.balance
      ? allow(pair)
      : prompt('balance not pre-approved', pair);
  }

  // push_transactions is a "broadcast" RPC. With sign:false (or omitted)
  // the wallet just pushes a pre-signed bundle (the user already approved
  // when they signed, typically via createOfferForIds) — treat it as
  // innocuous. With any truthy `sign`, the wallet signs the bundle on the
  // dapp's behalf, which collapses sign-and-broadcast into one step with
  // no user-visible content; that always prompts.
  //
  // We mirror the daemon's Python truthiness here: it does `if sign:`, so
  // values like "true", "false", 1, etc. all trigger signing on its side.
  // Strict `=== true` would let the dapp slip a string past us.
  //
  // The bundle's own spend was already debited at offer time. The top-level
  // `fee` field here is anything *extra* the dapp wants to add at push time;
  // we charge it against the budget conservatively so a compromised dapp
  // can't accumulate fees silently.
  if (command === 'chia_wallet.push_transactions') {
    if (payload?.sign) {
      return prompt('signing requested', pair);
    }
    if (!pair.grants.capabilities.innocuous) {
      return prompt('innocuous actions not pre-approved', pair);
    }
    const fee = readMojos(payload, 'fee') ?? ZERO;
    if (fee.isGreaterThan(0)) {
      const spent = new BigNumber(pair.spentMojos ?? 0);
      const cap = new BigNumber(pair.grants.spendingCapMojos ?? 0);
      if (spent.plus(fee).isGreaterThan(cap)) {
        return prompt('push fee exceeds remaining budget', pair);
      }
    }
    return allow(pair);
  }

  if (isInnocuousCommand(command)) {
    return pair.grants.capabilities.innocuous ? allow(pair) : prompt('innocuous not pre-approved', pair);
  }

  if (isSignCommand(command)) {
    return pair.grants.capabilities.sign ? allow(pair) : prompt('sign not pre-approved', pair);
  }

  const spend = getSpendClassification(command);
  if (spend) {
    return checkSpending(pair, spend, payload);
  }

  return prompt('sensitive command', pair);
}

function resolveAmount(
  classification: SpendClassification,
  payload: Record<string, unknown>,
): BigNumber | undefined {
  if (classification.amountResolver) return classification.amountResolver(payload);
  if (classification.amountField) return readMojos(payload, classification.amountField);
  return undefined;
}

function checkSpending(
  pair: PairRecord,
  classification: SpendClassification,
  payload: Record<string, unknown>,
): CheckContext {
  const mode = pair.grants.spendingMode ?? 'ask';
  if (mode === 'block') return deny('spending blocked for this app', pair);
  if (mode === 'ask') return prompt('spending needs confirmation', pair);

  // mode === 'auto'. Resolve a numeric XCH-mojo amount to budget against. If
  // the command shape doesn't expose one (CAT spend, NFT transfer, mixed
  // offer), prompt — we can't compare against an XCH cap fairly.
  const amount = resolveAmount(classification, payload);
  if (amount === undefined) return prompt('spending needs confirmation', pair);

  const fee = classification.feeField ? readMojos(payload, classification.feeField) ?? ZERO : ZERO;
  const total = amount.plus(fee);
  const spent = new BigNumber(pair.spentMojos ?? 0);
  const cap = new BigNumber(pair.grants.spendingCapMojos ?? 0);
  if (spent.plus(total).isGreaterThan(cap)) {
    return prompt('budget exhausted', pair);
  }
  return allow(pair);
}

/**
 * Charge the pair's spending budget for an auto-approved transaction. Should
 * be called once per actual command at the authorization point. Safe no-op
 * for non-spend commands, UI principals, or commands without an amount.
 */
export function consumeAllowedSpend(
  principal: Principal,
  command: string,
  payload: Record<string, unknown>,
): void {
  if (principal.kind !== 'pair') return;

  // push_transactions: only the optional top-level fee counts; the spend in
  // the bundle was already debited at offer time.
  if (command === 'chia_wallet.push_transactions') {
    const fee = readMojos(payload, 'fee') ?? ZERO;
    if (fee.isGreaterThan(0)) recordSpend(principal.topic, fee);
    return;
  }

  const spend = getSpendClassification(command);
  if (!spend) return;

  const amount = resolveAmount(spend, payload);
  if (amount === undefined) return;

  const fee = spend.feeField ? readMojos(payload, spend.feeField) ?? ZERO : ZERO;
  const total = amount.plus(fee);
  if (total.isLessThanOrEqualTo(0)) return;
  recordSpend(principal.topic, total);
}

// PairGrants is unused at runtime in this module but useful for downstream
// importers that re-export from here. Keep the re-export to avoid churn.
export type { PairGrants };

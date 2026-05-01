import { classifyCommand, isBalanceCommand, isUiAllowed } from './commandCapabilities';
import { getPair, recordSpend } from './pairStore';
import type { CheckResult, CommandClassification, PairGrants, PairRecord, Principal } from './types';

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

function readMojos(payload: Record<string, unknown>, field: string): number | undefined {
  const value = Number(payload?.[field]);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
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
    const fee = readMojos(payload, 'fee') ?? 0;
    if (fee > 0) {
      const spent = pair.spentMojos ?? 0;
      const cap = pair.grants.spendingCapMojos ?? 0;
      if (spent + fee > cap) {
        return prompt('push fee exceeds remaining budget', pair);
      }
    }
    return allow(pair);
  }

  // Capability-classified commands. INNOCUOUS_COMMANDS map to capability
  // 'innocuous'; anything else falls through to its specific capability
  // (sign / spend / offer) or to 'never'.
  const classification = classifyCommand(command);
  if (classification.kind === 'never') {
    return prompt('sensitive command', pair);
  }
  return checkCapability(pair, classification, payload);
}

function checkCapability(
  pair: PairRecord,
  classification: Extract<CommandClassification, { kind: 'capability' }>,
  payload: Record<string, unknown>,
): CheckContext {
  const { capability } = classification;
  if (capability === 'spend' || capability === 'offer') {
    return checkSpending(pair, classification, payload);
  }
  return pair.grants.capabilities[capability]
    ? allow(pair)
    : prompt(`${capability} not pre-approved`, pair);
}

function resolveAmount(
  classification: Extract<CommandClassification, { kind: 'capability' }>,
  payload: Record<string, unknown>,
): number | undefined {
  if (classification.amountResolver) return classification.amountResolver(payload);
  if (classification.amountField) return readMojos(payload, classification.amountField);
  return undefined;
}

function checkSpending(
  pair: PairRecord,
  classification: Extract<CommandClassification, { kind: 'capability' }>,
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

  const fee = classification.feeField ? readMojos(payload, classification.feeField) ?? 0 : 0;
  const total = amount + fee;
  const spent = pair.spentMojos ?? 0;
  if (spent + total > (pair.grants.spendingCapMojos ?? 0)) {
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
    const fee = readMojos(payload, 'fee') ?? 0;
    if (fee > 0) recordSpend(principal.topic, fee);
    return;
  }

  const c = classifyCommand(command);
  if (c.kind !== 'capability') return;
  if (c.capability !== 'spend' && c.capability !== 'offer') return;

  const amount = resolveAmount(c, payload);
  if (amount === undefined) return;

  const fee = c.feeField ? readMojos(payload, c.feeField) ?? 0 : 0;
  const total = amount + fee;
  if (total <= 0) return;
  recordSpend(principal.topic, total);
}

// PairGrants is unused at runtime in this module but useful for downstream
// importers that re-export from here. Keep the re-export to avoid churn.
export type { PairGrants };

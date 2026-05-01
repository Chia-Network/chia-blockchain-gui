import { classifyCommand, isBalanceCommand, isSpendBundleCommand } from './commandCapabilities';
import { getPair, recordSpend } from './pairStore';
import type { CheckResult, PairRecord, Principal } from './types';

export type CheckContext = {
  result: CheckResult;
  pair?: PairRecord;
};

/**
 * Pure decision function. No side effects. Safe to call multiple times for the
 * same command — for spends it answers "would this fit in the remaining
 * budget right now?" but does not debit the budget. The actual debit happens
 * in `consumeAllowedSpend`, called only at the real authorization point
 * (main-process webSocketBridge.onSend).
 */
export function checkPermission(
  principal: Principal,
  command: string,
  payload: Record<string, unknown>,
): CheckContext {
  const classification = classifyCommand(command);

  // Balance reads are universally allowed for the UI principal but gated for
  // pair principals so users can keep balance hidden from a paired dapp.
  if (principal.kind === 'pair' && isBalanceCommand(command)) {
    const pair = getPair(principal.topic);
    if (!pair) {
      return { result: { decision: 'deny', reason: 'unknown pair' } };
    }
    if (!pair.grants.capabilities.balance) {
      return { result: { decision: 'prompt', reason: 'balance not pre-approved' }, pair };
    }
    return { result: { decision: 'allow' }, pair };
  }

  // Pushing a pre-signed spend bundle moves funds. The UI principal is allowed
  // because the wallet UI reviews the spend before pushing. For pair
  // principals we honor the spendingMode setting — but since the bundle does
  // not expose a simple amount field, even auto mode prompts (we can't apply
  // the budget without parsing the bundle).
  if (principal.kind === 'pair' && isSpendBundleCommand(command)) {
    const pair = getPair(principal.topic);
    if (!pair) {
      return { result: { decision: 'deny', reason: 'unknown pair' } };
    }
    const mode = pair.grants.spendingMode ?? 'ask';
    if (mode === 'block') {
      return { result: { decision: 'deny', reason: 'spending blocked for this app' }, pair };
    }
    return { result: { decision: 'prompt', reason: 'spend bundle needs confirmation' }, pair };
  }

  if (classification.kind === 'allow') {
    return { result: { decision: 'allow' } };
  }

  if (principal.kind === 'ui') {
    return { result: { decision: 'prompt', reason: 'requires user confirmation' } };
  }

  const pair = getPair(principal.topic);
  if (!pair) {
    return { result: { decision: 'deny', reason: 'unknown pair' } };
  }

  if (classification.kind === 'never') {
    return { result: { decision: 'prompt', reason: 'sensitive command' }, pair };
  }

  const { capability, amountField, feeField } = classification;
  const mode = pair.grants.spendingMode ?? 'ask';

  if (capability === 'spend' || capability === 'offer') {
    if (mode === 'block') {
      return { result: { decision: 'deny', reason: 'spending blocked for this app' }, pair };
    }
    if (mode === 'ask') {
      return { result: { decision: 'prompt', reason: 'spending needs confirmation' }, pair };
    }
    if (capability === 'offer' || !amountField) {
      return { result: { decision: 'prompt', reason: 'spending needs confirmation' }, pair };
    }
    const amount = Number(payload?.[amountField]);
    if (!Number.isFinite(amount) || amount < 0) {
      return { result: { decision: 'prompt', reason: 'spend amount missing' }, pair };
    }
    const fee = feeField ? Number(payload?.[feeField] ?? 0) : 0;
    if (!Number.isFinite(fee) || fee < 0) {
      return { result: { decision: 'prompt', reason: 'spend fee missing' }, pair };
    }
    const total = amount + fee;
    const spent = pair.spentMojos ?? 0;
    const cap = pair.grants.spendingCapMojos ?? 0;
    if (spent + total > cap) {
      return { result: { decision: 'prompt', reason: 'budget exhausted' }, pair };
    }
    return { result: { decision: 'allow' }, pair };
  }

  if (!pair.grants.capabilities[capability]) {
    return { result: { decision: 'prompt', reason: `${capability} not pre-approved` }, pair };
  }

  return { result: { decision: 'allow' }, pair };
}

/**
 * Charge the pair's spending budget for an auto-approved transaction. Should
 * only be called once per actual command — at the authorization point. Safe
 * no-op for non-spend commands, UI principal, or commands that didn't include
 * an amount.
 */
export function consumeAllowedSpend(
  principal: Principal,
  command: string,
  payload: Record<string, unknown>,
): void {
  if (principal.kind !== 'pair') return;
  const classification = classifyCommand(command);
  if (classification.kind !== 'capability') return;
  if (classification.capability !== 'spend') return;
  if (!classification.amountField) return;
  const amount = Number(payload?.[classification.amountField]);
  if (!Number.isFinite(amount) || amount < 0) return;
  const fee = classification.feeField ? Number(payload?.[classification.feeField] ?? 0) : 0;
  const safeFee = Number.isFinite(fee) && fee >= 0 ? fee : 0;
  const total = amount + safeFee;
  if (total <= 0) return;
  recordSpend(principal.topic, total);
}

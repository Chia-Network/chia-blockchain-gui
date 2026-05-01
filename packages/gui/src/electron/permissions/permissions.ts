import { classifyCommand } from './commandCapabilities';
import { getPair, recordSpend } from './pairStore';
import type { CheckResult, PairRecord, Principal } from './types';

export type CheckContext = {
  result: CheckResult;
  pair?: PairRecord;
};

export function checkPermission(
  principal: Principal,
  command: string,
  payload: Record<string, unknown>,
): CheckContext {
  const classification = classifyCommand(command);

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

  const { capability, amountField } = classification;
  const mode = pair.grants.spendingMode ?? 'ask';

  if (capability === 'spend' || capability === 'offer') {
    if (mode === 'block') {
      return { result: { decision: 'deny', reason: 'spending blocked for this app' }, pair };
    }
    if (mode === 'ask') {
      return { result: { decision: 'prompt', reason: 'spending needs confirmation' }, pair };
    }
    // mode === 'auto' — fall through to budget check
    if (capability === 'offer' || !amountField) {
      // Offers and unscoped spends (NFT transfers etc.) can't be auto-charged
      // against a numeric budget, so always prompt even in auto mode.
      return { result: { decision: 'prompt', reason: 'spending needs confirmation' }, pair };
    }
    const amount = Number(payload?.[amountField]);
    if (!Number.isFinite(amount) || amount < 0) {
      return { result: { decision: 'prompt', reason: 'spend amount missing' }, pair };
    }
    const spent = pair.spentMojos ?? 0;
    const cap = pair.grants.spendingCapMojos ?? 0;
    if (spent + amount > cap) {
      return { result: { decision: 'prompt', reason: 'budget exhausted' }, pair };
    }
    recordSpend(principal.topic, amount);
    return { result: { decision: 'allow' }, pair };
  }

  if (!pair.grants.capabilities[capability]) {
    return { result: { decision: 'prompt', reason: `${capability} not pre-approved` }, pair };
  }

  return { result: { decision: 'allow' }, pair };
}

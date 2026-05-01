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
  if (!pair.grants.capabilities[capability]) {
    return { result: { decision: 'prompt', reason: `${capability} not pre-approved` }, pair };
  }

  if (capability === 'spend') {
    if (!amountField) {
      return { result: { decision: 'prompt', reason: 'transfer amount cannot be auto-verified' }, pair };
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
    // Auto-approved spend: charge the budget so a compromised dapp can't drain
    // via many small transactions under the per-call limit.
    recordSpend(principal.topic, amount);
  }

  return { result: { decision: 'allow' }, pair };
}

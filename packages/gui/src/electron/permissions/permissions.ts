import { classifyCommand } from './commandCapabilities';
import { getPair } from './pairStore';
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
  if (pair.grants.expiresAt && Date.now() > pair.grants.expiresAt) {
    return { result: { decision: 'prompt', reason: 'pair grants expired' }, pair };
  }

  if (classification.kind === 'never') {
    return { result: { decision: 'prompt', reason: 'sensitive command' }, pair };
  }

  const { capability, amountField } = classification;
  if (!pair.grants.capabilities[capability]) {
    return { result: { decision: 'prompt', reason: `pair lacks ${capability} capability` }, pair };
  }

  if (capability === 'spend') {
    if (!amountField) {
      return { result: { decision: 'prompt', reason: 'transfer amount cannot be auto-verified' }, pair };
    }
    const amount = Number(payload?.[amountField]);
    if (!Number.isFinite(amount)) {
      return { result: { decision: 'prompt', reason: 'spend amount missing' }, pair };
    }
    if (amount > pair.grants.spendingCapMojos) {
      return { result: { decision: 'prompt', reason: 'spend exceeds cap' }, pair };
    }
  }

  return { result: { decision: 'allow' }, pair };
}

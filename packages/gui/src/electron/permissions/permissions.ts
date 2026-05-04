import BigNumber from 'bignumber.js';

import { checkPairAccess } from './checkPairAccess';
import {
  getSpendClassification,
  isBalanceCommand,
  isInnocuousCommand,
  isSignCommand,
  isUiAllowed,
} from './commandCapabilities';
import { getPair, recordSpend } from './pairStore';
import type {
  Decision,
  PairContext,
  PairGrants,
  PairRecord,
  Principal,
  SpendClassification,
} from './types';

const ZERO = new BigNumber(0);
const NOOP = () => {};

const allowDecision = (commit: () => void = NOOP): Decision => ({ kind: 'allow', commit });
const promptDecision = (reason: string, pair?: PairContext): Decision => ({
  kind: 'prompt',
  reason,
  pair,
});
const denyDecision = (reason: string): Decision => ({ kind: 'deny', reason });

function pairCtx(pair: PairRecord): PairContext {
  return {
    topic: pair.topic,
    name: pair.metadata.name,
    url: pair.metadata.url,
    icon: pair.metadata.icon,
    description: pair.metadata.description,
  };
}

// BigNumber because mojo amounts routinely exceed 2^53.
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

// Idempotent so accidental double-invocation can't double-charge. Captures
// `mojos` at decision time, not authorization time.
function makeCommit(topic: string, mojos: BigNumber): () => void {
  let consumed = false;
  return () => {
    if (consumed) return;
    consumed = true;
    if (!mojos.isFinite() || mojos.isLessThanOrEqualTo(0)) return;
    recordSpend(topic, mojos);
  };
}

export type ResolveContext = {
  /** Wire form (`chia_<name>`); required for pair principals. */
  wcCommand?: string;
  fingerprint?: number;
  mainnet?: boolean;
};

export function resolvePermission(
  principal: Principal,
  command: string,
  payload: Record<string, unknown>,
  ctx: ResolveContext = {},
): Decision {
  if (principal.kind === 'ui') {
    return isUiAllowed(command) ? allowDecision() : promptDecision('requires user confirmation');
  }

  const access = checkPairAccess(
    {
      topic: principal.topic,
      wcCommand: ctx.wcCommand,
      fingerprint: ctx.fingerprint,
      mainnet: ctx.mainnet,
    },
    { getPair },
  );
  if (!access.ok) return denyDecision(access.reason);
  const { pair } = access;
  const dialogCtx = pairCtx(pair);
  const wcCommand = ctx.wcCommand!; // checkPairAccess rejected when missing

  // Bypass skips the prompt but never overrides the spending budget — spend
  // commands fall through to resolveSpending below.
  if (pair.bypass.includes(wcCommand) && !getSpendClassification(command)) {
    return allowDecision();
  }

  if (isBalanceCommand(command)) {
    return pair.grants.capabilities.balance
      ? allowDecision()
      : promptDecision('balance not pre-approved', dialogCtx);
  }

  // push_transactions: pre-signed bundle is innocuous; dapp-asks-to-sign
  // always prompts. Truthy (not strict ===) matches the daemon's Python
  // `if sign:` so the dapp can't slip "true" past us. Extra `fee` here is
  // on top of the bundle's own spend, charged conservatively.
  if (command === 'chia_wallet.push_transactions') {
    if (payload?.sign) return promptDecision('signing requested', dialogCtx);
    if (!pair.grants.capabilities.innocuous) {
      return promptDecision('innocuous actions not pre-approved', dialogCtx);
    }
    const fee = readMojos(payload, 'fee') ?? ZERO;
    if (fee.isGreaterThan(0)) {
      const spent = new BigNumber(pair.spentMojos ?? 0);
      const cap = new BigNumber(pair.grants.spendingCapMojos ?? 0);
      if (spent.plus(fee).isGreaterThan(cap)) {
        return promptDecision('push fee exceeds remaining budget', dialogCtx);
      }
    }
    return allowDecision(makeCommit(pair.topic, fee));
  }

  if (isInnocuousCommand(command)) {
    return pair.grants.capabilities.innocuous
      ? allowDecision()
      : promptDecision('innocuous not pre-approved', dialogCtx);
  }

  if (isSignCommand(command)) {
    return pair.grants.capabilities.sign
      ? allowDecision()
      : promptDecision('sign not pre-approved', dialogCtx);
  }

  const spend = getSpendClassification(command);
  if (spend) {
    return resolveSpending(pair, dialogCtx, spend, payload);
  }

  return promptDecision('sensitive command', dialogCtx);
}

function resolveAmount(
  classification: SpendClassification,
  payload: Record<string, unknown>,
): BigNumber | undefined {
  if (classification.amountResolver) return classification.amountResolver(payload);
  if (classification.amountField) return readMojos(payload, classification.amountField);
  return undefined;
}

function resolveSpending(
  pair: PairRecord,
  ctx: PairContext,
  classification: SpendClassification,
  payload: Record<string, unknown>,
): Decision {
  const mode = pair.grants.spendingMode ?? 'ask';
  if (mode === 'block') return denyDecision('spending blocked for this app');
  if (mode === 'ask') return promptDecision('spending needs confirmation', ctx);

  // 'auto'. Without a numeric XCH-mojo amount (CAT spend, NFT transfer,
  // mixed offer), prompt — can't fairly compare against an XCH cap.
  const amount = resolveAmount(classification, payload);
  if (amount === undefined) return promptDecision('spending needs confirmation', ctx);

  const fee = classification.feeField ? readMojos(payload, classification.feeField) ?? ZERO : ZERO;
  const total = amount.plus(fee);
  const spent = new BigNumber(pair.spentMojos ?? 0);
  const cap = new BigNumber(pair.grants.spendingCapMojos ?? 0);
  if (spent.plus(total).isGreaterThan(cap)) {
    return promptDecision('budget exhausted', ctx);
  }
  return allowDecision(makeCommit(pair.topic, total));
}

export type { PairGrants };

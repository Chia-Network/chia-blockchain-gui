import BigNumber from 'bignumber.js';

import toSnakeCase from '../utils/toSnakeCase';

import { checkPairAccess } from './checkPairAccess';
import { getSpendClassification, isUiAllowed } from './commandCapabilities';
import { getPair, recordSpend } from './pairStore';
import type { Decision, PairContext, PairGrants, PairRecord, Principal, SpendClassification } from './types';

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

// Per-command bypass is the single source of truth for "always allow."
// Spend-class commands are governed by spendingMode + cap regardless of
// bypass — the budget is the right knob there.
export async function resolvePermission(
  principal: Principal,
  command: string,
  rawPayload: Record<string, unknown>,
  ctx: ResolveContext = {},
): Promise<Decision> {
  if (principal.kind === 'ui') {
    return isUiAllowed(command) ? allowDecision() : promptDecision('requires user confirmation');
  }

  // Canonicalize keys to snake_case before any payload-shape check. The
  // wire-out also snake-cases (main.tsx), so the daemon would honor `Sign`
  // / `Fee` / etc. — without canonicalizing here, a case-sensitive lookup
  // like `payload.sign` would miss `Sign: true` and let the dapp dodge the
  // signing prompt or undercount the fee against the spending cap.
  const payload = toSnakeCase(rawPayload) as Record<string, unknown>;

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

  const spend = getSpendClassification(command);
  if (spend) {
    return resolveSpending(pair, dialogCtx, spend, payload);
  }

  // push_transactions: pre-signed bundle is innocuous and goes through bypass;
  // dapp-asks-to-sign always prompts (no bypass for sign). Truthy (not strict
  // ===) matches the daemon's Python `if sign:` so the dapp can't slip "true"
  // past us. Extra `fee` here is on top of the bundle's own spend, charged
  // conservatively against the budget.
  if (command === 'chia_wallet.push_transactions') {
    if (payload?.sign) return promptDecision('signing requested', dialogCtx);
    if (!pair.bypass.includes(wcCommand)) {
      return promptDecision('not in bypass list', dialogCtx);
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

  if (pair.bypass.includes(wcCommand)) {
    return allowDecision();
  }

  return promptDecision('not in bypass list', dialogCtx);
}

async function resolveAmount(
  classification: SpendClassification,
  payload: Record<string, unknown>,
): Promise<BigNumber | undefined> {
  if (classification.amountResolver) return classification.amountResolver(payload);
  if (classification.amountField) return readMojos(payload, classification.amountField);
  return undefined;
}

async function resolveSpending(
  pair: PairRecord,
  ctx: PairContext,
  classification: SpendClassification,
  payload: Record<string, unknown>,
): Promise<Decision> {
  const mode = pair.grants.spendingMode ?? 'ask';
  if (mode === 'block') return denyDecision('spending blocked for this app');
  if (mode === 'ask') return promptDecision('spending needs confirmation', ctx);

  // 'auto'. Without a numeric XCH-mojo amount (CAT spend, NFT transfer,
  // mixed offer), prompt — can't fairly compare against an XCH cap.
  const amount = await resolveAmount(classification, payload);
  if (amount === undefined) return promptDecision('spending needs confirmation', ctx);

  const fee = classification.feeField ? (readMojos(payload, classification.feeField) ?? ZERO) : ZERO;
  const total = amount.plus(fee);
  const spent = new BigNumber(pair.spentMojos ?? 0);
  const cap = new BigNumber(pair.grants.spendingCapMojos ?? 0);
  if (spent.plus(total).isGreaterThan(cap)) {
    return promptDecision('budget exhausted', ctx);
  }
  return allowDecision(makeCommit(pair.topic, total));
}

export type { PairGrants };

import BigNumber from 'bignumber.js';

import toSnakeCase from '../utils/toSnakeCase';

import { checkPairAccess } from './checkPairAccess';
import { getSpendClassification, isSignCommand, isUiAllowed } from './commandCapabilities';
import { getPair, recordUsage } from './pairStore';
import type { Decision, PairContext, PairGrants, PairRecord, Principal, SpendClassification } from './types';

const ZERO = new BigNumber(0);
const NOOP = () => {};

const allowDecision = (commit: () => void = NOOP): Decision => ({ kind: 'allow', commit });
const promptDecision = (reason: string, pair?: PairContext): Decision => ({
  kind: 'prompt',
  reason,
  pair,
});
const denyDecision = (reason: string, code: number): Decision => ({ kind: 'deny', reason, code });

const PUSH_TRANSACTIONS = 'chia_wallet.push_transactions';

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

// Idempotent: a double-invocation can't double-charge. Captures `mojos` at
// decision time, not authorization time.
function makeCommit(topic: string, mojos: BigNumber): () => void {
  let consumed = false;
  return () => {
    if (consumed) return;
    consumed = true;
    if (!mojos.isFinite() || mojos.isLessThanOrEqualTo(0)) return;
    recordUsage(topic, mojos);
  };
}

export type ResolveContext = {
  /** Wire form (`chia_<name>`); required for pair principals. */
  wcCommand?: string;
  fingerprint?: number;
  /** Required for pair principals; ignored for UI. Missing → network mismatch. */
  mainnet?: boolean;
};

// `'unresolvable'` = command moves funds but can't be priced in XCH mojos
// (CAT/NFT/mixed/missing-amount). `undefined` = not eligible for the allowance.
type AllowanceCharge = BigNumber | 'unresolvable' | undefined;

async function resolveAllowanceCharge(command: string, payload: Record<string, unknown>): Promise<AllowanceCharge> {
  // push_transactions only contributes the optional fee — bundle is pre-signed.
  if (command === PUSH_TRANSACTIONS) {
    return readMojos(payload, 'fee') ?? ZERO;
  }

  const spend = getSpendClassification(command);
  if (!spend) return undefined;

  const amount = await resolveAmount(spend, payload);
  if (amount === undefined) return 'unresolvable';

  const fee = spend.feeField ? (readMojos(payload, spend.feeField) ?? ZERO) : ZERO;
  return amount.plus(fee);
}

async function resolveAmount(
  classification: SpendClassification,
  payload: Record<string, unknown>,
): Promise<BigNumber | undefined> {
  if (classification.amountResolver) return classification.amountResolver(payload);
  if (classification.amountField) return readMojos(payload, classification.amountField);
  return undefined;
}

function isSigningRequest(command: string, payload: Record<string, unknown>): boolean {
  // Truthy match (not `===`) mirrors the daemon's Python `if sign:`.
  if (command === PUSH_TRANSACTIONS && payload?.sign) return true;
  return isSignCommand(command);
}

/**
 * Two auto-approval mechanisms:
 *  - `pair.bypass` is exact command-level trust.
 *  - `pair.grants.xchMojos` is a bounded XCH fallback for spend-class commands.
 * Sign-class and `push_transactions` with `sign: true` always prompt.
 */
export async function resolvePermission(
  principal: Principal,
  command: string,
  rawPayload: Record<string, unknown>,
  ctx: ResolveContext = {},
): Promise<Decision> {
  if (principal.kind === 'ui') {
    return isUiAllowed(command) ? allowDecision() : promptDecision('requires user confirmation');
  }

  // Canonicalise before any field read: wire-out also snake-cases, so a
  // dapp's `Sign: true` would otherwise dodge the gate while the daemon
  // still honored it.
  const payload = toSnakeCase(rawPayload) as Record<string, unknown>;

  const access = checkPairAccess(
    {
      topic: principal.topic,
      wcCommand: ctx.wcCommand,
      fingerprint: ctx.fingerprint,
      mainnet: ctx.mainnet as boolean,
    },
    { getPair },
  );
  if (!access.ok) return denyDecision(access.reason, access.code);
  const { pair } = access;
  const dialogCtx = pairCtx(pair);
  const wcCommand = ctx.wcCommand!; // checkPairAccess rejected when missing

  if (isSigningRequest(command, payload)) {
    return promptDecision('signing requested', dialogCtx);
  }

  if (pair.bypass.includes(wcCommand)) {
    return allowDecision();
  }

  const charge = await resolveAllowanceCharge(command, payload);
  if (charge !== undefined) {
    return resolveAllowance(pair, dialogCtx, charge);
  }

  return promptDecision('not in bypass list', dialogCtx);
}

function resolveAllowance(pair: PairRecord, ctx: PairContext, charge: BigNumber | 'unresolvable'): Decision {
  if (charge === 'unresolvable') {
    return promptDecision('non-XCH spend needs confirmation', ctx);
  }

  // Zero-charge (fee=0 push, request-only offer): no funds move, silent
  // regardless of allowance.
  if (charge.isLessThanOrEqualTo(0)) return allowDecision();

  const allowance = new BigNumber(pair.grants.xchMojos ?? 0);
  if (allowance.isLessThanOrEqualTo(0)) {
    return promptDecision('spending needs confirmation', ctx);
  }

  const used = new BigNumber(pair.usedMojos ?? 0);
  if (used.plus(charge).isGreaterThan(allowance)) {
    return promptDecision('allowance exhausted', ctx);
  }

  return allowDecision(makeCommit(pair.topic, charge));
}

export type { PairGrants };

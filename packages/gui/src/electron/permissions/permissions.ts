import BigNumber from 'bignumber.js';

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
  DecisionWire,
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
 * Build the commit thunk for an allow decision. Captures the resolved mojo
 * amount so the budget is debited against the same number the cap check used,
 * even if the payload mutates between resolution and authorization. Idempotent
 * — a second call is a no-op so accidental double-invocation can't double-charge.
 */
function makeCommit(topic: string, mojos: BigNumber): () => void {
  let consumed = false;
  return () => {
    if (consumed) return;
    consumed = true;
    if (!mojos.isFinite() || mojos.isLessThanOrEqualTo(0)) return;
    recordSpend(topic, mojos);
  };
}

/**
 * Single resolution point for any command. Returns a discriminated decision:
 * - `allow` carries `commit()` that records the resolved spend on call.
 * - `prompt` carries dialog-shaped pair info and the human-readable reason.
 * - `deny` is terminal — no further resolution possible.
 *
 * The function is "pure" in that it doesn't touch the budget itself; the only
 * side effect happens through `commit()`. Calling `resolvePermission` repeatedly
 * with the same inputs is safe — each call returns its own independent commit
 * closure, and only the one that's invoked records a spend.
 *
 * `wcCommand` is the camelCase WC name the dapp asked for. We require it for
 * pair principals so we can verify it against the per-pair `allowedWcCommands`
 * list captured at pairing time — that is the user's consent boundary.
 */
export function resolvePermission(
  principal: Principal,
  command: string,
  payload: Record<string, unknown>,
  wcCommand?: string,
): Decision {
  if (principal.kind === 'ui') {
    return isUiAllowed(command) ? allowDecision() : promptDecision('requires user confirmation');
  }

  const pair = getPair(principal.topic);
  if (!pair) return denyDecision('unknown pair');
  const ctx = pairCtx(pair);

  // Per-pair allowlist gate. The user only consented to the commands shown
  // in the pair dialog; anything else — even if its schema marks it
  // dapp-allowed at the wallet level — is a deny. A compromised renderer
  // can supply any (`destination`, `wcCommand`) pair to dispatchAsPair, so
  // checking against the persisted list is the only way to bind dispatch
  // to the consent that was actually granted.
  if (!wcCommand) {
    return denyDecision('missing wc command');
  }
  if (!pair.allowedWcCommands.includes(wcCommand)) {
    return denyDecision(`command not granted for this pair: ${wcCommand}`);
  }

  if (isBalanceCommand(command)) {
    return pair.grants.capabilities.balance
      ? allowDecision()
      : promptDecision('balance not pre-approved', ctx);
  }

  // push_transactions is a "broadcast" RPC. With sign:false (or omitted) the
  // wallet just pushes a pre-signed bundle (the user already approved when
  // they signed, typically via createOfferForIds) — treat it as innocuous.
  // With any truthy `sign`, the wallet signs the bundle on the dapp's behalf,
  // which collapses sign-and-broadcast into one step with no user-visible
  // content; that always prompts.
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
    if (payload?.sign) return promptDecision('signing requested', ctx);
    if (!pair.grants.capabilities.innocuous) {
      return promptDecision('innocuous actions not pre-approved', ctx);
    }
    const fee = readMojos(payload, 'fee') ?? ZERO;
    if (fee.isGreaterThan(0)) {
      const spent = new BigNumber(pair.spentMojos ?? 0);
      const cap = new BigNumber(pair.grants.spendingCapMojos ?? 0);
      if (spent.plus(fee).isGreaterThan(cap)) {
        return promptDecision('push fee exceeds remaining budget', ctx);
      }
    }
    return allowDecision(makeCommit(pair.topic, fee));
  }

  if (isInnocuousCommand(command)) {
    return pair.grants.capabilities.innocuous
      ? allowDecision()
      : promptDecision('innocuous not pre-approved', ctx);
  }

  if (isSignCommand(command)) {
    return pair.grants.capabilities.sign
      ? allowDecision()
      : promptDecision('sign not pre-approved', ctx);
  }

  const spend = getSpendClassification(command);
  if (spend) {
    return resolveSpending(pair, ctx, spend, payload);
  }

  return promptDecision('sensitive command', ctx);
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

  // mode === 'auto'. Resolve a numeric XCH-mojo amount to budget against. If
  // the command shape doesn't expose one (CAT spend, NFT transfer, mixed
  // offer), prompt — we can't compare against an XCH cap fairly.
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

/**
 * Strip the commit thunk so a Decision can cross the IPC boundary. The
 * renderer never gets to invoke commit — only the main process, after the
 * actual authorization at the wallet bridge, runs side effects.
 */
export function toWire(decision: Decision): DecisionWire {
  switch (decision.kind) {
    case 'allow':
      return { kind: 'allow' };
    case 'prompt':
      return { kind: 'prompt', reason: decision.reason, pair: decision.pair };
    case 'deny':
      return { kind: 'deny', reason: decision.reason };
  }
}

// PairGrants is unused at runtime in this module but useful for downstream
// importers that re-export from here. Keep the re-export to avoid churn.
export type { PairGrants };

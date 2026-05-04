import type { PairRecord } from './types';

export type PairAccessCheck = {
  topic: string;
  /** Wire form (`chia_<name>`). */
  wcCommand?: string;
  fingerprint?: number;
  /** Required: every dapp call is network-scoped. Missing → deny. */
  mainnet: boolean;
};

export type PairAccessResult = { ok: true; pair: PairRecord } | { ok: false; reason: string };

export type CheckPairAccessDeps = {
  getPair: (topic: string) => PairRecord | undefined;
};

// Failure order is intentional: pair > command > fingerprint > network —
// error points at the first thing wrong. Network is fail-closed: a missing
// or mistyped `mainnet` flag denies, because every dapp request operates
// against a specific daemon network.
export function checkPairAccess(check: PairAccessCheck, deps: CheckPairAccessDeps): PairAccessResult {
  const pair = deps.getPair(check.topic);
  if (!pair) return { ok: false, reason: 'unknown pair' };
  if (!check.wcCommand) return { ok: false, reason: 'missing wc command' };
  if (!pair.commands.includes(check.wcCommand)) {
    return { ok: false, reason: `command not granted for this pair: ${check.wcCommand}` };
  }
  if (check.fingerprint !== undefined && !pair.fingerprints.includes(check.fingerprint)) {
    return { ok: false, reason: `fingerprint not granted for this pair: ${check.fingerprint}` };
  }
  if (typeof check.mainnet !== 'boolean' || check.mainnet !== pair.mainnet) {
    return { ok: false, reason: 'network mismatch' };
  }
  return { ok: true, pair };
}

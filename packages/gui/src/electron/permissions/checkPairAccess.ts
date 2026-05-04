import type { PairRecord } from './types';

export type PairAccessCheck = {
  topic: string;
  /** Wire form (`chia_<name>`). */
  wcCommand?: string;
  fingerprint?: number;
  mainnet?: boolean;
};

export type PairAccessResult = { ok: true; pair: PairRecord } | { ok: false; reason: string };

export type CheckPairAccessDeps = {
  getPair: (topic: string) => PairRecord | undefined;
};

// Optional check fields opt-out their gate when omitted. Failure order is
// intentional: pair > command > fingerprint > network — error points at
// the first thing wrong.
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
  if (check.mainnet !== undefined && check.mainnet !== pair.mainnet) {
    return { ok: false, reason: 'network mismatch' };
  }
  return { ok: true, pair };
}

import type { PairRecord } from './types';

export type PairAccessCheck = {
  topic: string;
  /** WC command in wire form (`chia_<name>`). Required for pair principals. */
  wcCommand?: string;
  /** Dapp-claimed fingerprint. Validated against `pair.fingerprints` when supplied. */
  fingerprint?: number;
  /** Chain id the dapp is sending in (`chia:mainnet` → true, `chia:testnet` → false).
   *  Validated against `pair.mainnet` when supplied. */
  mainnet?: boolean;
};

export type PairAccessResult =
  | { ok: true; pair: PairRecord }
  | { ok: false; reason: string };

export type CheckPairAccessDeps = {
  getPair: (topic: string) => PairRecord | undefined;
};

/**
 * Single source of truth for "is this dapp request even valid for this
 * pair." Replaces the four scattered checks (pair-exists, commands-
 * includes, fingerprint-includes, mainnet-matches) that previously lived
 * across `resolvePermission`, `dispatchAsPair`'s chia_app.* branch,
 * `processSessionRequest`, and `assertMainnetMatchesMainPair`.
 *
 * Order matters — earlier failures suppress later ones so the user-
 * facing error message points at the actual reason. "unknown pair" wins
 * over everything; missing wcCommand wins over the rest; commands-
 * includes wins over fingerprint/mainnet.
 *
 * Optional fields opt their respective check OUT when omitted, so
 * callers that don't have the value (e.g. CHECK IPC, which receives no
 * fingerprint) can still gate on the rest.
 */
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

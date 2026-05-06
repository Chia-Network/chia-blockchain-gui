import { WcErrorCode } from '../../@types/WcError';

import type { PairRecord } from './types';

export type PairAccessCheck = {
  topic: string;
  /** Wire form (`chia_<name>`). */
  wcCommand?: string;
  fingerprint?: number;
  /** Required: every dapp call is network-scoped. Missing → deny. */
  mainnet: boolean;
};

export type PairAccessResult =
  | { ok: true; pair: PairRecord }
  | { ok: false; reason: string; code: number };

export type CheckPairAccessDeps = {
  getPair: (topic: string) => PairRecord | undefined;
};

// Failure order: pair > command > fingerprint > network. First wrong thing wins.
// Network fail-closed on missing/mistyped flag — every dapp request is
// network-scoped.
export function checkPairAccess(check: PairAccessCheck, deps: CheckPairAccessDeps): PairAccessResult {
  const pair = deps.getPair(check.topic);
  if (!pair) return { ok: false, reason: 'Pair not found', code: WcErrorCode.USER_REJECTED };
  if (!check.wcCommand) {
    return { ok: false, reason: 'missing wc command', code: WcErrorCode.INVALID_PARAMS };
  }
  if (!pair.commands.includes(check.wcCommand)) {
    return {
      ok: false,
      reason: `command not granted for this pair: ${check.wcCommand}`,
      code: WcErrorCode.UNAUTHORIZED_METHOD,
    };
  }
  if (check.fingerprint !== undefined && !pair.fingerprints.includes(check.fingerprint)) {
    return {
      ok: false,
      reason: `fingerprint not granted for this pair: ${check.fingerprint}`,
      code: WcErrorCode.UNAUTHORIZED_METHOD,
    };
  }
  if (typeof check.mainnet !== 'boolean' || check.mainnet !== pair.mainnet) {
    return { ok: false, reason: 'network mismatch', code: WcErrorCode.UNSUPPORTED_CHAINS };
  }
  return { ok: true, pair };
}

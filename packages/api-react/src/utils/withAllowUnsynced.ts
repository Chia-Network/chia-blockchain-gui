import { selectWalletRpcPreferences } from '../slices/walletRpcPreferences';
import type { RootState } from '../store';

/**
 * Merge `allowUnsynced: true` only when BOTH the user preference AND the
 * per-call RPC arg opt in.  This lets individual endpoints gate unsynced
 * access even when the global preference is on (chia-blockchain PR #20805).
 */
export default function withAllowUnsynced<T extends object>(state: unknown, args: T): T & { allowUnsynced?: boolean } {
  const { allowUnsynced: preferenceEnabled } = selectWalletRpcPreferences(state as RootState);
  const argsEnabled = 'allowUnsynced' in args && (args as Record<string, unknown>).allowUnsynced;

  if (preferenceEnabled && argsEnabled) {
    return { ...args, allowUnsynced: true };
  }
  return { ...args, allowUnsynced: false };
}

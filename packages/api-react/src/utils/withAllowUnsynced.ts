import { selectWalletRpcPreferences } from '../slices/walletRpcPreferences';
import type { RootState } from '../store';

/** Merge `allowUnsynced: true` when the user enabled it in settings (chia-blockchain PR #20805). */
export default function withAllowUnsynced<T extends object>(state: unknown, args: T): T & { allowUnsynced?: boolean } {
  const { allowUnsynced } = selectWalletRpcPreferences(state as RootState);
  if (allowUnsynced) {
    return { ...args, allowUnsynced: true };
  }
  return args;
}

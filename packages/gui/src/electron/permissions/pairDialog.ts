import BigNumber from 'bignumber.js';

import Unit from '../constants/Unit';
import { getCommandByWc } from '../constants/commandRegistry';
import chiaFormatter from '../utils/chiaFormatter';

import { isBalanceCommand, isInnocuousCommand, isSignCommand, isSpendCommand } from './commandCapabilities';
import type { PairGrants } from './types';

export function dialogResultToGrants(result: Record<string, unknown>): PairGrants {
  // Unchecked checkbox -> allowance is 0 regardless of input value.
  if (result.enableAllowance !== true) {
    return { allowanceMojos: '0' };
  }
  let mojos = '0';
  const rawXch = result.allowanceXch;
  if (rawXch !== null && rawXch !== undefined && rawXch !== '') {
    try {
      const xch = new BigNumber(typeof rawXch === 'string' ? rawXch : String(rawXch));
      if (xch.isFinite() && xch.isGreaterThan(0)) {
        mojos = chiaFormatter(xch, Unit.CHIA).to(Unit.MOJO).toBigNumber().integerValue(BigNumber.ROUND_FLOOR).toFixed(0);
      }
    } catch {
      // Invalid input -> allowance stays 0.
    }
  }
  return { allowanceMojos: mojos };
}

// Reads `bypass-<wcCommand>` form fields and returns the wire-form commands
// the user ticked. Filters to the dapp's actually-granted commands so a
// stray field can't grant something the registry didn't allow at pair time.
export function dialogResultToBypass(result: Record<string, unknown>, granted: string[]): string[] {
  const grantedSet = new Set(granted);
  const bypass: string[] = [];
  for (const [key, value] of Object.entries(result)) {
    if (key.startsWith('bypass-') && value === true) {
      const wcCommand = key.slice('bypass-'.length);
      if (grantedSet.has(wcCommand)) bypass.push(wcCommand);
    }
  }
  return bypass;
}

export function dialogResultToFingerprints(result: Record<string, unknown>): number[] {
  const raw = result.wallets;
  const list = Array.isArray(raw) ? raw : [];
  return list.map((v) => Number(v)).filter((n) => Number.isFinite(n));
}

export function classifyForPairDialog(grantedWireCommands: string[]) {
  const innocuous: string[] = [];
  const balance: string[] = [];
  const sign: string[] = [];
  const notifications: string[] = [];
  const spending: string[] = [];
  const other: string[] = [];
  for (const wcCommand of grantedWireCommands) {
    if (wcCommand === 'chia_showNotification') {
      notifications.push(wcCommand);
    } else {
      const entry = getCommandByWc(wcCommand);
      if (entry) {
        const { nsCommand } = entry;
        if (isBalanceCommand(nsCommand)) balance.push(wcCommand);
        else if (isInnocuousCommand(nsCommand)) innocuous.push(wcCommand);
        else if (isSignCommand(nsCommand)) sign.push(wcCommand);
        else if (isSpendCommand(nsCommand)) spending.push(wcCommand);
        else other.push(wcCommand);
      }
    }
  }
  return { innocuous, balance, sign, notifications, spending, other };
}

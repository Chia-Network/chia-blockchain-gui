import BigNumber from 'bignumber.js';

import Unit from '../constants/Unit';
import { getCommandByWc } from '../constants/commandRegistry';
import chiaFormatter from '../utils/chiaFormatter';

import { isBalanceCommand, isInnocuousCommand, isSignCommand, isSpendCommand } from './commandCapabilities';
import type { PairGrants } from './types';

export function dialogResultToGrants(result: Record<string, unknown>): PairGrants {
  // Unchecked checkbox -> allowance is 0 regardless of input value.
  if (result.enableAllowance !== true) {
    return { xchMojos: '0' };
  }
  let mojos = '0';
  const rawXch = result.allowanceXch;
  if (rawXch !== null && rawXch !== undefined && rawXch !== '') {
    try {
      const xch = new BigNumber(typeof rawXch === 'string' ? rawXch : String(rawXch));
      if (xch.isFinite() && xch.isGreaterThan(0)) {
        mojos = chiaFormatter(xch, Unit.CHIA)
          .to(Unit.MOJO)
          .toBigNumber()
          .integerValue(BigNumber.ROUND_FLOOR)
          .toFixed(0);
      }
    } catch {
      // Invalid input -> allowance stays 0.
    }
  }
  return { xchMojos: mojos };
}

// Reads the multi-checkbox `bypass` form field (an array of wire-form wcCommands
// for the boxes the user ticked). Filters to the dapp's actually-granted
// commands so a stray value can't grant something the registry didn't allow
// at pair time. Drops sign-class commands — `permissions.resolvePermission`
// always prompts for them, so persisting a bypass entry would silently no-op
// and mislead the user at edit time (the toggle would re-appear pre-checked
// despite never taking effect).
export function dialogResultToBypass(result: Record<string, unknown>, granted: string[]): string[] {
  const grantedSet = new Set(granted);
  const raw = Array.isArray(result.bypass) ? result.bypass : [];
  const bypass: string[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && grantedSet.has(item)) {
      const ns = getCommandByWc(item)?.nsCommand;
      if (!ns || !isSignCommand(ns)) {
        bypass.push(item);
      }
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

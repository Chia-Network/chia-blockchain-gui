import BigNumber from 'bignumber.js';
import path from 'node:path';

import { getCommandByWc } from '../constants/commandRegistry';
import { getUserDataDir } from '../utils/userData';
import { readData, writeData } from '../utils/yamlUtils';

import { isBalanceCommand, isInnocuousCommand, isSignCommand } from './commandCapabilities';
import type { PairRecord } from './types';

// Expands legacy `pair.grants.capabilities.<bit>: true` into membership in
// the per-command bypass list. Only commands the dapp was actually granted
// (`commands`) are added — never expand silently beyond what the user
// originally approved at pair time.
function legacyCapabilityCommands(
  caps: Record<string, unknown>,
  grantedWireCommands: string[],
): string[] {
  if (!caps || typeof caps !== 'object') return [];
  const balance = caps.balance === true;
  const innocuous = caps.innocuous === true;
  const sign = caps.sign === true;
  const notifications = caps.notifications === true;
  if (!balance && !innocuous && !sign && !notifications) return [];

  const result: string[] = [];
  for (const wcCommand of grantedWireCommands) {
    if (notifications && wcCommand === 'chia_showNotification') {
      result.push(wcCommand);
      continue;
    }
    const entry = getCommandByWc(wcCommand);
    if (!entry) continue;
    const { nsCommand } = entry;
    if (balance && isBalanceCommand(nsCommand)) result.push(wcCommand);
    else if (innocuous && isInnocuousCommand(nsCommand)) result.push(wcCommand);
    else if (sign && isSignCommand(nsCommand)) result.push(wcCommand);
  }
  return result;
}

const FILE = 'dapp-pairs.yaml';

let cache: PairRecord[] | undefined;

function getPath() {
  const userDataDir = getUserDataDir();
  if (!userDataDir) {
    throw new Error('userDataDir needs to be initialized');
  }
  return path.join(userDataDir, FILE);
}

function load(): PairRecord[] {
  if (cache) return cache;
  const data = readData(getPath());
  const raw = Array.isArray(data?.pairs) ? (data.pairs as Record<string, unknown>[]) : [];
  // Migrations on read. Missing/legacy fields default to the safest value
  // (deny-all, mainnet) so an upgrade can't silently expand dapp reach.
  const list = raw.map((p) => {
    const commands = (() => {
      if (Array.isArray(p?.commands)) {
        return (p.commands as unknown[]).filter((c): c is string => typeof c === 'string');
      }
      // Legacy `allowedWcCommands` stored bare names; new `commands` is wire form.
      if (Array.isArray(p?.allowedWcCommands)) {
        return (p.allowedWcCommands as unknown[])
          .filter((c): c is string => typeof c === 'string')
          .map((c) => (c.startsWith('chia_') ? c : `chia_${c}`));
      }
      return [];
    })();
    const baseBypass = Array.isArray(p?.bypass)
      ? (p.bypass as unknown[]).filter((c): c is string => typeof c === 'string')
      : [];
    const rawGrants = (p?.grants ?? {}) as Record<string, unknown>;

    // Capabilities bits expand into bypass union, then the field is dropped.
    // Old runtime semantics ("balance:true silently allows all balance
    // commands") become explicit per-command bypass entries; the bool
    // never gets persisted again.
    const rawCaps = (rawGrants.capabilities ?? {}) as Record<string, unknown>;
    const fromCapabilities = legacyCapabilityCommands(rawCaps, commands);
    const bypass = Array.from(new Set([...baseBypass, ...fromCapabilities]));

    const spendingMode = typeof rawGrants.spendingMode === 'string' ? rawGrants.spendingMode : 'ask';
    const grants = {
      spendingMode: spendingMode === 'block' || spendingMode === 'auto' ? spendingMode : 'ask',
      spendingCapMojos: typeof rawGrants.spendingCapMojos === 'string' ? rawGrants.spendingCapMojos : '0',
    };

    return {
      ...(p as Record<string, unknown>),
      grants,
      commands,
      bypass,
      mainnet: typeof p?.mainnet === 'boolean' ? p.mainnet : true,
    } as PairRecord;
  });
  cache = list;
  return list;
}

function persist(pairs: PairRecord[]) {
  cache = pairs;
  writeData({ pairs }, getPath());
}

export function listPairs(): PairRecord[] {
  return load().slice();
}

export function getPair(topic: string): PairRecord | undefined {
  return load().find((p) => p.topic === topic);
}

export function upsertPair(pair: PairRecord) {
  const next = load().filter((p) => p.topic !== pair.topic);
  next.push(pair);
  persist(next);
}

export function removePair(topic: string) {
  persist(load().filter((p) => p.topic !== topic));
}

// One persist; no-op when the list is already empty so updatedAt doesn't drift.
export function resetBypass(topic: string): PairRecord | undefined {
  const pair = getPair(topic);
  if (!pair) return undefined;
  if (pair.bypass.length === 0) return pair;
  const next: PairRecord = { ...pair, bypass: [], updatedAt: Date.now() };
  upsertPair(next);
  return next;
}

// One persist for the whole list. Pairs already empty stay byte-identical
// (same updatedAt) so the file diff is minimal.
export function resetBypassAll(): void {
  const list = load();
  const now = Date.now();
  let mutated = false;
  const next = list.map((p) => {
    if (p.bypass.length === 0) return p;
    mutated = true;
    return { ...p, bypass: [], updatedAt: now };
  });
  if (mutated) persist(next);
}

export function recordSpend(topic: string, mojos: BigNumber) {
  const pair = getPair(topic);
  if (!pair) return;
  if (!mojos.isFinite() || mojos.isLessThanOrEqualTo(0)) return;
  const current = new BigNumber(pair.spentMojos ?? 0);
  const next: PairRecord = { ...pair, spentMojos: current.plus(mojos).toFixed(0) };
  upsertPair(next);
}

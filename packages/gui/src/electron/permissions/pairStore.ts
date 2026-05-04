import BigNumber from 'bignumber.js';
import path from 'node:path';

import { getUserDataDir } from '../utils/userData';
import { readData, writeData } from '../utils/yamlUtils';

import type { PairRecord } from './types';

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
    const bypass = Array.isArray(p?.bypass)
      ? (p.bypass as unknown[]).filter((c): c is string => typeof c === 'string')
      : [];
    const rawGrants = (p?.grants ?? {}) as Record<string, unknown>;
    const rawCaps = (rawGrants.capabilities ?? {}) as Record<string, unknown>;
    const grants = {
      ...rawGrants,
      capabilities: {
        ...rawCaps,
        notifications: rawCaps.notifications === true,
      },
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

// Toggles a single command in pair.bypass. Returns the updated record,
// the existing record (unchanged) when state already matches, or undefined
// for unknown topic. No-op skips the persist + updatedAt bump.
export function setBypass(topic: string, wcCommand: string, enabled: boolean): PairRecord | undefined {
  const pair = getPair(topic);
  if (!pair) return undefined;
  const isAlready = pair.bypass.includes(wcCommand);
  if (isAlready === enabled) return pair;
  const next: PairRecord = enabled
    ? { ...pair, bypass: [...pair.bypass, wcCommand], updatedAt: Date.now() }
    : { ...pair, bypass: pair.bypass.filter((c) => c !== wcCommand), updatedAt: Date.now() };
  upsertPair(next);
  return next;
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

// Clear the cumulative auto-spend counter so the dapp gets its full budget
// back. No-op (no persist, no updatedAt bump) when already zero.
export function resetSpentMojos(topic: string): PairRecord | undefined {
  const pair = getPair(topic);
  if (!pair) return undefined;
  if (!pair.spentMojos || pair.spentMojos === '0' || new BigNumber(pair.spentMojos).isZero()) {
    return pair;
  }
  const next: PairRecord = { ...pair, spentMojos: '0', updatedAt: Date.now() };
  upsertPair(next);
  return next;
}

export function recordSpend(topic: string, mojos: BigNumber) {
  const pair = getPair(topic);
  if (!pair) return;
  if (!mojos.isFinite() || mojos.isLessThanOrEqualTo(0)) return;
  const current = new BigNumber(pair.spentMojos ?? 0);
  const next: PairRecord = { ...pair, spentMojos: current.plus(mojos).toFixed(0) };
  upsertPair(next);
}

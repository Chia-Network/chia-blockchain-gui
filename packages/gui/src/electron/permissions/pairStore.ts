import path from 'node:path';

import BigNumber from 'bignumber.js';

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

function normalizeRecord(p: Record<string, unknown>): PairRecord {
  const commands = Array.isArray(p?.commands)
    ? (p.commands as unknown[]).filter((c): c is string => typeof c === 'string')
    : [];
  const rawBypass = Array.isArray(p?.bypass)
    ? (p.bypass as unknown[]).filter((c): c is string => typeof c === 'string')
    : [];

  const rawGrants = (p?.grants ?? {}) as Record<string, unknown>;
  const xchMojos = typeof rawGrants.xchMojos === 'string' ? rawGrants.xchMojos : '0';
  const usedMojos = typeof p?.usedMojos === 'string' ? p.usedMojos : '0';

  return {
    topic: typeof p?.topic === 'string' ? p.topic : '',
    mainnet: typeof p?.mainnet === 'boolean' ? p.mainnet : true,
    metadata: (p?.metadata ?? { name: '' }) as PairRecord['metadata'],
    fingerprints: Array.isArray(p?.fingerprints)
      ? (p.fingerprints as unknown[]).filter((f): f is number => typeof f === 'number')
      : [],
    createdAt: typeof p?.createdAt === 'number' ? p.createdAt : 0,
    updatedAt: typeof p?.updatedAt === 'number' ? p.updatedAt : 0,
    grants: { xchMojos },
    usedMojos,
    commands,
    bypass: rawBypass,
  };
}

function load(): PairRecord[] {
  if (cache) return cache;
  const data = readData(getPath());
  const raw = Array.isArray(data?.pairs) ? (data.pairs as Record<string, unknown>[]) : [];
  // Missing or wrong-typed fields default to deny-all / mainnet / allowance 0
  // so a hand-edited record can't silently expand dapp reach.
  const list = raw.map(normalizeRecord);
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

// Idempotency lives at the call site (see `makeCommit` in `permissions.ts`);
// this function only guards against non-positive / non-finite inputs.
export function recordUsage(topic: string, mojos: BigNumber) {
  const pair = getPair(topic);
  if (!pair) return;
  if (!mojos.isFinite() || mojos.isLessThanOrEqualTo(0)) return;
  const current = new BigNumber(pair.usedMojos ?? 0);
  const next: PairRecord = { ...pair, usedMojos: current.plus(mojos).toFixed(0) };
  upsertPair(next);
}

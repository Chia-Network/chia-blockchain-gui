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
  const raw = Array.isArray(data?.pairs) ? (data.pairs as PairRecord[]) : [];
  // Normalize fields that may be missing on disk. `allowedWcCommands` was
  // added later; treat its absence as deny-all (empty list) rather than a
  // backwards-compatible "everything allowed" fallback. Forces existing
  // records to be re-paired to grant any commands.
  const list = raw.map((p) => ({
    ...p,
    allowedWcCommands: Array.isArray(p?.allowedWcCommands) ? p.allowedWcCommands.filter((c) => typeof c === 'string') : [],
  }));
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

export function updateGrants(topic: string, grants: PairRecord['grants']) {
  const pair = getPair(topic);
  if (!pair) return undefined;
  const next: PairRecord = { ...pair, grants, updatedAt: Date.now() };
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

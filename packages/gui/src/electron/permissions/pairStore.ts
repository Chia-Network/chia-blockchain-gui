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

export function recordSpend(topic: string, mojos: BigNumber) {
  const pair = getPair(topic);
  if (!pair) return;
  if (!mojos.isFinite() || mojos.isLessThanOrEqualTo(0)) return;
  const current = new BigNumber(pair.spentMojos ?? 0);
  const next: PairRecord = { ...pair, spentMojos: current.plus(mojos).toFixed(0) };
  upsertPair(next);
}

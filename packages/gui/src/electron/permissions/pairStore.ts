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
  // Normalize fields that may be missing on disk. Four migrations:
  //   1. `allowedWcCommands` (bare names) → `commands` (wire form,
  //      `chia_<name>`). Old field is dropped on next write.
  //   2. `bypass: []` defaulted when absent. New field, deny-all on
  //      legacy records — user must re-grant via the Confirm checkbox.
  //   3. `mainnet: true` defaulted when absent. Conservative — assumes
  //      mainnet on legacy records, which is what the renderer's stored
  //      pair list also defaulted to. Re-pair to correct.
  //   4. `capabilities.notifications: false` defaulted when absent. New
  //      field; legacy records get the safe deny default — user must
  //      re-grant via the Pair dialog or the per-call "Don't ask again".
  // Reading missing fields as deny / mainnet rather than as
  // backwards-compatible "everything allowed" / unknown fallback keeps
  // upgrades from silently expanding dapp reach.
  const list = raw.map((p) => {
    const commands = (() => {
      if (Array.isArray(p?.commands)) {
        return (p.commands as unknown[]).filter((c): c is string => typeof c === 'string');
      }
      // Migrate legacy `allowedWcCommands` (bare WC names) into the new
      // `commands` (wire form). Strings that already start with `chia_`
      // pass through; bare ones get the prefix.
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

import path from 'node:path';

import { pairRecordSchema, type PairRecord } from './pairSchemas';
import { getUserDataDir } from './userData';
import { readData, writeData } from './yamlUtils';

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
  if (cache) {
    return cache;
  }

  const data = readData(getPath());

  const pairRecords: PairRecord[] = [];

  if (data?.pairs && Array.isArray(data.pairs)) {
    for (const pair of data.pairs) {
      try {
        const record = pairRecordSchema.parse(pair);
        pairRecords.push(record);
      } catch (error) {
        console.error(`Invalid pair record: ${pair}`, error);
      }
    }
  }

  cache = pairRecords;
  return pairRecords;
}

function persist(pairs: PairRecord[]) {
  writeData({ pairs }, getPath());

  cache = pairs;
}

export function getPairs(): PairRecord[] {
  return [...load()];
}

export function findPair(topic: string): PairRecord | undefined {
  return load().find((p) => p.topic === topic);
}

export function addPair(pair: Omit<PairRecord, 'updatedAt' | 'createdAt'>): PairRecord {
  if (findPair(pair.topic)) {
    throw new Error(`Pair already exists: ${pair.topic}`);
  }

  const newPair = {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...pair,
  };

  persist([...load(), newPair]);

  return newPair;
}

export function updatePair(topic: string, pair: Partial<PairRecord>): PairRecord {
  const pairs = [...load()];

  const index = pairs.findIndex((p) => p.topic === topic);
  if (index === -1) {
    throw new Error(`Pair not found: ${topic}`);
  }

  const existing = pairs[index];

  const newPair = {
    ...existing,
    ...pair,
    updatedAt: Date.now(),
  };

  pairs[index] = newPair;

  persist(pairs);

  return newPair;
}

export function addBypassCommand(topic: string, command: string): PairRecord {
  const pair = findPair(topic);
  if (!pair) {
    throw new Error(`Pair not found: ${topic}`);
  }

  if (pair.bypass.includes(command)) {
    return pair;
  }

  return updatePair(topic, {
    bypass: [...pair.bypass, command],
  });
}

export function removePair(topic: string) {
  persist(load().filter((p) => p.topic !== topic));
}

export function resetBypass(topic: string): void {
  const pair = findPair(topic);
  if (!pair) {
    throw new Error(`Pair not found: ${topic}`);
  }

  if (!pair.bypass.length) {
    return;
  }

  updatePair(topic, {
    bypass: [],
  });
}

export function resetBypassAll(): void {
  const list = load();

  const updated = list.map((pair) => ({
    ...pair,
    bypass: [],
    updatedAt: Date.now(),
  }));

  persist(updated);
}

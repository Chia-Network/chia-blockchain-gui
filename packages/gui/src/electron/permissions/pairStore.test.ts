import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import BigNumber from 'bignumber.js';

import type { PairRecord } from './types';

let mockTempDir: string;

jest.mock('../utils/userData', () => ({
  // Resolved lazily so each test sees the per-test directory.
  getUserDataDir: () => mockTempDir,
}));

// Pulled in after the mock so the module reads the patched userDataDir.
const loadStore = (): typeof import('./pairStore') => {
  jest.resetModules();
  // eslint-disable-next-line global-require -- module must be required after jest.resetModules to pick up mocked deps
  return require('./pairStore');
};

function makePair(overrides: Partial<PairRecord> = {}): PairRecord {
  return {
    topic: 'topic-1',
    mainnet: true,
    metadata: { name: 'Test Dapp' },
    fingerprints: [123],
    createdAt: 1,
    updatedAt: 1,
    usedMojos: '0',
    commands: [],
    bypass: [],
    grants: { xchMojos: '0' },
    ...overrides,
  };
}

beforeEach(() => {
  mockTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pair-store-test-'));
});

afterEach(() => {
  fs.rmSync(mockTempDir, { recursive: true, force: true });
});

describe('pairStore - listPairs / getPair / upsertPair / removePair', () => {
  it('returns empty list when no file exists', () => {
    const store = loadStore();
    expect(store.listPairs()).toEqual([]);
    expect(store.getPair('topic-1')).toBeUndefined();
  });

  it('persists a pair across module reloads', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a' }));

    expect(fs.existsSync(path.join(mockTempDir, 'dapp-pairs.yaml'))).toBe(true);

    const reload = loadStore();
    const pairs = reload.listPairs();
    expect(pairs).toHaveLength(1);
    expect(pairs[0].topic).toBe('a');
    expect(reload.getPair('a')?.topic).toBe('a');
  });

  it('replaces an existing pair on upsert (no duplicates)', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', metadata: { name: 'First' } }));
    store.upsertPair(makePair({ topic: 'a', metadata: { name: 'Second' } }));

    const pairs = store.listPairs();
    expect(pairs).toHaveLength(1);
    expect(pairs[0].metadata.name).toBe('Second');
  });

  it('removes a pair', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a' }));
    store.upsertPair(makePair({ topic: 'b' }));

    store.removePair('a');
    expect(store.getPair('a')).toBeUndefined();
    expect(store.getPair('b')?.topic).toBe('b');
  });

  it('listPairs returns a copy (callers cannot mutate cache)', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a' }));
    const pairs = store.listPairs();
    pairs.push(makePair({ topic: 'b' }));
    expect(store.listPairs()).toHaveLength(1);
  });
});

describe('pairStore - recordUsage (allowance accounting)', () => {
  it('accumulates used mojos across multiple calls', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', usedMojos: '0' }));

    store.recordUsage('a', new BigNumber(100));
    expect(store.getPair('a')?.usedMojos).toBe('100');

    store.recordUsage('a', new BigNumber(250));
    expect(store.getPair('a')?.usedMojos).toBe('350');

    store.recordUsage('a', new BigNumber(1));
    expect(store.getPair('a')?.usedMojos).toBe('351');
  });

  it('persists accumulated usage across module reloads', () => {
    const a = loadStore();
    a.upsertPair(makePair({ topic: 'a', usedMojos: '500' }));
    a.recordUsage('a', new BigNumber(123));

    const b = loadStore();
    expect(b.getPair('a')?.usedMojos).toBe('623');
  });

  it('is a no-op for unknown topic', () => {
    const store = loadStore();
    store.recordUsage('unknown', new BigNumber(100));
    expect(store.listPairs()).toEqual([]);
  });

  it('is a no-op for non-positive amounts', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', usedMojos: '500' }));

    store.recordUsage('a', new BigNumber(0));
    store.recordUsage('a', new BigNumber(-1));
    store.recordUsage('a', new BigNumber('-9999999999999999999'));

    expect(store.getPair('a')?.usedMojos).toBe('500');
  });

  it('is a no-op for non-finite amounts', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', usedMojos: '500' }));

    store.recordUsage('a', new BigNumber(NaN));
    store.recordUsage('a', new BigNumber(Infinity));

    expect(store.getPair('a')?.usedMojos).toBe('500');
  });

  it('preserves precision beyond JS safe-integer range', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', usedMojos: '0' }));

    const huge = new BigNumber('99999999999999999999');
    store.recordUsage('a', huge);
    store.recordUsage('a', new BigNumber(1));

    expect(store.getPair('a')?.usedMojos).toBe('100000000000000000000');
  });

  it('truncates fractional mojos via toFixed(0)', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', usedMojos: '0' }));

    // toFixed(0) rounds half-to-even on BigNumber by default.
    store.recordUsage('a', new BigNumber('1.4'));
    expect(store.getPair('a')?.usedMojos).toBe('1');

    store.recordUsage('a', new BigNumber('0.7'));
    // 1 + 0.7 = 1.7 → rounded to 2.
    expect(store.getPair('a')?.usedMojos).toBe('2');
  });

  it('treats undefined usedMojos on the existing record as zero', () => {
    loadStore();
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const record = makePair({ topic: 'a' });
    delete (record as Partial<PairRecord>).usedMojos;
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(record)}\n`);

    const reload = loadStore();
    reload.recordUsage('a', new BigNumber(42));
    expect(reload.getPair('a')?.usedMojos).toBe('42');
  });

  it('does not affect siblings', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', usedMojos: '100' }));
    store.upsertPair(makePair({ topic: 'b', usedMojos: '200' }));

    store.recordUsage('a', new BigNumber(50));

    expect(store.getPair('a')?.usedMojos).toBe('150');
    expect(store.getPair('b')?.usedMojos).toBe('200');
  });
});

describe('pairStore - commands field normalization', () => {
  it('defaults to [] when the field is absent on disk', () => {
    loadStore();
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const record = makePair({ topic: 'a' });
    delete (record as Partial<PairRecord>).commands;
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(record)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.commands).toEqual([]);
  });

  it('defaults to [] when the field is non-array on disk', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const record = makePair({ topic: 'a' });
    (record as unknown as { commands: unknown }).commands = 'oops';
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(record)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.commands).toEqual([]);
  });

  it('strips non-string entries from the persisted list', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const record = makePair({ topic: 'a' });
    (record as unknown as { commands: unknown }).commands = ['chia_sendTransaction', 42, null, 'chia_getWallets'];
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(record)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.commands).toEqual(['chia_sendTransaction', 'chia_getWallets']);
  });

  it('round-trips a real list through write+read', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', commands: ['chia_sendTransaction', 'chia_getWallets'] }));

    const reload = loadStore();
    expect(reload.getPair('a')?.commands).toEqual(['chia_sendTransaction', 'chia_getWallets']);
  });
});

describe('pairStore - bypass field normalization', () => {
  it('defaults to [] when the field is absent on disk', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const record = makePair({ topic: 'a' });
    delete (record as Partial<PairRecord>).bypass;
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(record)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.bypass).toEqual([]);
  });

  it('defaults to [] when the field is non-array on disk', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const record = makePair({ topic: 'a' });
    (record as unknown as { bypass: unknown }).bypass = { 0: 'chia_x' };
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(record)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.bypass).toEqual([]);
  });

  it('round-trips a real list through write+read', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', bypass: ['chia_getWallets', 'chia_signMessageById'] }));

    const reload = loadStore();
    expect(reload.getPair('a')?.bypass).toEqual(['chia_getWallets', 'chia_signMessageById']);
  });
});

describe('pairStore - mainnet field normalization', () => {
  it('defaults to true when the field is absent on disk', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const record = makePair({ topic: 'a' });
    delete (record as Partial<PairRecord>).mainnet;
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(record)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.mainnet).toBe(true);
  });

  it('preserves an explicit false', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', mainnet: false }));

    const reload = loadStore();
    expect(reload.getPair('a')?.mainnet).toBe(false);
  });
});

describe('pairStore - grant normalization', () => {
  it('treats missing grants as `xchMojos: "0"`', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const pair = makePair({ topic: 'a' });
    delete (pair as Partial<PairRecord>).grants;
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(pair)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.grants).toEqual({ xchMojos: '0' });
  });

  it('treats missing usage as zero', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const pair = makePair({ topic: 'a' });
    delete (pair as Partial<PairRecord>).usedMojos;
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(pair)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.usedMojos).toBe('0');
  });
});

describe('pairStore - bypass command preservation', () => {
  // `bypass` is exact command-level trust. Spend-class wcCommands are valid
  // here too; the XCH allowance is only the bounded fallback when no bypass
  // entry exists.

  it('preserves `chia_pushTransactions` in a persisted bypass list', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const record = makePair({
      topic: 'a',
      bypass: ['chia_getWallets', 'chia_pushTransactions', 'chia_signMessageByAddress'],
    });
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(record)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.bypass).toEqual([
      'chia_getWallets',
      'chia_pushTransactions',
      'chia_signMessageByAddress',
    ]);
  });

  it('preserves spend wcCommands in bypass', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const record = makePair({
      topic: 'a',
      bypass: [
        'chia_sendTransaction',
        'chia_createOfferForIds',
        'chia_takeOffer',
        'chia_pushTransactions',
        'chia_getWallets',
      ],
    });
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(record)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.bypass).toEqual([
      'chia_sendTransaction',
      'chia_createOfferForIds',
      'chia_takeOffer',
      'chia_pushTransactions',
      'chia_getWallets',
    ]);
  });

  it('leaves a clean bypass list untouched (no false positives)', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const record = makePair({
      topic: 'a',
      bypass: ['chia_getWallets', 'chia_getWalletBalance', 'chia_signMessageByAddress'],
    });
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(record)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.bypass).toEqual([
      'chia_getWallets',
      'chia_getWalletBalance',
      'chia_signMessageByAddress',
    ]);
  });
});

describe('pairStore - resetBypass (single pair)', () => {
  it('clears a non-empty bypass list', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', bypass: ['chia_getWalletBalance', 'chia_getWallets'] }));

    const updated = store.resetBypass('a');
    expect(updated?.bypass).toEqual([]);
    expect(store.getPair('a')?.bypass).toEqual([]);
  });

  it('persists across reloads', () => {
    // The whole point of the reset button is that it survives an app
    // restart. Reading from cache could pass even with a broken persist.
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', bypass: ['chia_getWallets'] }));
    store.resetBypass('a');

    const reload = loadStore();
    expect(reload.getPair('a')?.bypass).toEqual([]);
  });

  it('returns undefined for an unknown topic without persisting', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', bypass: ['chia_getWallets'] }));

    expect(store.resetBypass('nonexistent')).toBeUndefined();
    // Existing pair untouched.
    expect(store.getPair('a')?.bypass).toEqual(['chia_getWallets']);
  });

  it('is a no-op when the bypass list is already empty (does not bump updatedAt)', () => {
    // Idle clicks on "Reset" shouldn't churn updatedAt — sync logic
    // elsewhere may key off it.
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', updatedAt: 100, bypass: [] }));

    const result = store.resetBypass('a');
    expect(result?.updatedAt).toBe(100);
    expect(store.getPair('a')?.updatedAt).toBe(100);
  });

  it('bumps updatedAt when there was something to clear', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', updatedAt: 100, bypass: ['chia_getWallets'] }));

    const before = Date.now();
    const result = store.resetBypass('a');
    const after = Date.now();

    expect(result?.updatedAt).toBeGreaterThanOrEqual(before);
    expect(result?.updatedAt).toBeLessThanOrEqual(after);
  });

  it('only touches the targeted pair, not siblings', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', bypass: ['chia_getWalletBalance'] }));
    store.upsertPair(makePair({ topic: 'b', bypass: ['chia_getWallets'] }));

    store.resetBypass('a');
    expect(store.getPair('a')?.bypass).toEqual([]);
    expect(store.getPair('b')?.bypass).toEqual(['chia_getWallets']);
  });

  it('preserves the rest of the pair record (commands, fingerprints, grants, usedMojos)', () => {
    const store = loadStore();
    store.upsertPair(
      makePair({
        topic: 'a',
        bypass: ['chia_getWallets'],
        commands: ['chia_sendTransaction', 'chia_getWallets'],
        fingerprints: [111, 222],
        usedMojos: '500',
      }),
    );

    const result = store.resetBypass('a');
    expect(result?.commands).toEqual(['chia_sendTransaction', 'chia_getWallets']);
    expect(result?.fingerprints).toEqual([111, 222]);
    expect(result?.usedMojos).toBe('500');
  });
});

describe('pairStore - resetBypassAll (every pair)', () => {
  it('clears bypass on every pair', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', bypass: ['chia_getWallets'] }));
    store.upsertPair(makePair({ topic: 'b', bypass: ['chia_getWalletBalance', 'chia_signMessageByAddress'] }));
    store.upsertPair(makePair({ topic: 'c', bypass: [] }));

    store.resetBypassAll();
    expect(store.getPair('a')?.bypass).toEqual([]);
    expect(store.getPair('b')?.bypass).toEqual([]);
    expect(store.getPair('c')?.bypass).toEqual([]);
  });

  it('persists across reloads', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', bypass: ['chia_getWallets'] }));
    store.upsertPair(makePair({ topic: 'b', bypass: ['chia_getWalletBalance'] }));
    store.resetBypassAll();

    const reload = loadStore();
    expect(reload.getPair('a')?.bypass).toEqual([]);
    expect(reload.getPair('b')?.bypass).toEqual([]);
  });

  it('preserves updatedAt on pairs that had nothing to clear', () => {
    // Otherwise resetBypassAll would silently rewrite every pair's
    // timestamp on every click. Keep the file diff to actual mutations.
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'untouched', updatedAt: 100, bypass: [] }));
    store.upsertPair(makePair({ topic: 'cleared', updatedAt: 100, bypass: ['chia_getWallets'] }));

    store.resetBypassAll();

    expect(store.getPair('untouched')?.updatedAt).toBe(100);
    expect(store.getPair('cleared')?.updatedAt).not.toBe(100);
  });

  it('is a no-op when no pair has any bypass (does not rewrite the file)', () => {
    // If everything's already empty, resetBypassAll skips the write so
    // the YAML file mtime doesn't change. Pin via byte-identical content.
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', bypass: [] }));
    store.upsertPair(makePair({ topic: 'b', bypass: [] }));
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const before = fs.readFileSync(file, 'utf-8');

    store.resetBypassAll();

    const after = fs.readFileSync(file, 'utf-8');
    expect(after).toBe(before);
  });

  it('handles an empty pair list (no pairs at all)', () => {
    const store = loadStore();
    expect(() => store.resetBypassAll()).not.toThrow();
    expect(store.listPairs()).toEqual([]);
  });

  it('preserves the rest of each pair record', () => {
    const store = loadStore();
    store.upsertPair(
      makePair({
        topic: 'a',
        bypass: ['chia_getWallets'],
        commands: ['chia_sendTransaction'],
        fingerprints: [111],
        usedMojos: '500',
      }),
    );

    store.resetBypassAll();
    const pair = store.getPair('a');
    expect(pair?.commands).toEqual(['chia_sendTransaction']);
    expect(pair?.fingerprints).toEqual([111]);
    expect(pair?.usedMojos).toBe('500');
  });
});

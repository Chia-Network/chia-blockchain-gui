import BigNumber from 'bignumber.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { PairRecord } from './types';

let mockTempDir: string;

jest.mock('../utils/userData', () => ({
  // Resolved lazily so each test sees the per-test directory.
  getUserDataDir: () => mockTempDir,
}));

// Pulled in after the mock so the module reads the patched userDataDir.
// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const loadStore = (): typeof import('./pairStore') => {
  jest.resetModules();
  // eslint-disable-next-line global-require
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
    spentMojos: '0',
    commands: [],
    bypass: [],
    grants: {
      capabilities: {
        balance: false,
        innocuous: false,
        sign: false,
        offer: false,
        spend: false,
        notifications: false,
      },
      spendingMode: 'ask',
      spendingCapMojos: '0',
    },
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

describe('pairStore - updateGrants', () => {
  it('updates grants and bumps updatedAt', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', updatedAt: 100 }));

    const before = Date.now();
    const updated = store.updateGrants('a', {
      capabilities: {
        balance: true,
        innocuous: true,
        sign: false,
        offer: false,
        spend: false,
        notifications: false,
      },
      spendingMode: 'ask',
      spendingCapMojos: '0',
    });
    const after = Date.now();

    expect(updated?.grants.capabilities.balance).toBe(true);
    expect(updated?.grants.capabilities.innocuous).toBe(true);
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(before);
    expect(updated?.updatedAt).toBeLessThanOrEqual(after);
  });

  it('returns undefined for unknown topic', () => {
    const store = loadStore();
    const result = store.updateGrants('missing', {
      capabilities: {
        balance: false,
        innocuous: false,
        sign: false,
        offer: false,
        spend: false,
        notifications: false,
      },
      spendingMode: 'ask',
      spendingCapMojos: '0',
    });
    expect(result).toBeUndefined();
  });

  it('preserves spentMojos when updating grants', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', spentMojos: '1234' }));
    const updated = store.updateGrants('a', {
      capabilities: {
        balance: true,
        innocuous: false,
        sign: false,
        offer: false,
        spend: false,
        notifications: false,
      },
      spendingMode: 'auto',
      spendingCapMojos: '999999',
    });
    expect(updated?.spentMojos).toBe('1234');
  });
});

describe('pairStore - recordSpend (spend cap accounting)', () => {
  it('accumulates spent mojos across multiple calls', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', spentMojos: '0' }));

    store.recordSpend('a', new BigNumber(100));
    expect(store.getPair('a')?.spentMojos).toBe('100');

    store.recordSpend('a', new BigNumber(250));
    expect(store.getPair('a')?.spentMojos).toBe('350');

    store.recordSpend('a', new BigNumber(1));
    expect(store.getPair('a')?.spentMojos).toBe('351');
  });

  it('persists accumulated spend across module reloads', () => {
    const a = loadStore();
    a.upsertPair(makePair({ topic: 'a', spentMojos: '500' }));
    a.recordSpend('a', new BigNumber(123));

    const b = loadStore();
    expect(b.getPair('a')?.spentMojos).toBe('623');
  });

  it('is a no-op for unknown topic', () => {
    const store = loadStore();
    store.recordSpend('unknown', new BigNumber(100));
    expect(store.listPairs()).toEqual([]);
  });

  it('is a no-op for non-positive amounts', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', spentMojos: '500' }));

    store.recordSpend('a', new BigNumber(0));
    store.recordSpend('a', new BigNumber(-1));
    store.recordSpend('a', new BigNumber('-9999999999999999999'));

    expect(store.getPair('a')?.spentMojos).toBe('500');
  });

  it('is a no-op for non-finite amounts', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', spentMojos: '500' }));

    store.recordSpend('a', new BigNumber(NaN));
    store.recordSpend('a', new BigNumber(Infinity));

    expect(store.getPair('a')?.spentMojos).toBe('500');
  });

  it('preserves precision beyond JS safe-integer range', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', spentMojos: '0' }));

    const huge = new BigNumber('99999999999999999999');
    store.recordSpend('a', huge);
    store.recordSpend('a', new BigNumber(1));

    expect(store.getPair('a')?.spentMojos).toBe('100000000000000000000');
  });

  it('truncates fractional mojos via toFixed(0)', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', spentMojos: '0' }));

    // toFixed(0) rounds half-to-even on BigNumber by default.
    store.recordSpend('a', new BigNumber('1.4'));
    expect(store.getPair('a')?.spentMojos).toBe('1');

    store.recordSpend('a', new BigNumber('0.7'));
    // 1 + 0.7 = 1.7 → rounded to 2.
    expect(store.getPair('a')?.spentMojos).toBe('2');
  });

  it('treats undefined spentMojos on the existing record as zero', () => {
    const store = loadStore();
    // Simulate an older record with no spentMojos field on disk.
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = makePair({ topic: 'a' });
    delete (legacy as Partial<PairRecord>).spentMojos;
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    reload.recordSpend('a', new BigNumber(42));
    expect(reload.getPair('a')?.spentMojos).toBe('42');
  });

  it('does not affect siblings', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', spentMojos: '100' }));
    store.upsertPair(makePair({ topic: 'b', spentMojos: '200' }));

    store.recordSpend('a', new BigNumber(50));

    expect(store.getPair('a')?.spentMojos).toBe('150');
    expect(store.getPair('b')?.spentMojos).toBe('200');
  });
});

describe('pairStore - commands field migration', () => {
  // Pair records persisted before the allowlist landed have no `commands`
  // field. Reading that as "any command goes" would silently extend dapp
  // reach; reading it as `[]` means the user has to re-pair to grant
  // anything, which is the safe default for an upgrade.

  it('defaults to [] when the field is absent on disk', () => {
    const store = loadStore();
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = makePair({ topic: 'a' });
    delete (legacy as Partial<PairRecord>).commands;
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.commands).toEqual([]);
    void store;
  });

  it('defaults to [] when the field is non-array on disk', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = makePair({ topic: 'a' });
    (legacy as unknown as { commands: unknown }).commands = 'oops';
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.commands).toEqual([]);
  });

  it('strips non-string entries from the persisted list', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = makePair({ topic: 'a' });
    (legacy as unknown as { commands: unknown }).commands = [
      'chia_sendTransaction',
      42,
      null,
      'chia_getWallets',
    ];
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.commands).toEqual(['chia_sendTransaction', 'chia_getWallets']);
  });

  it('round-trips a real list through write+read', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', commands: ['chia_sendTransaction', 'chia_getWallets'] }));

    const reload = loadStore();
    expect(reload.getPair('a')?.commands).toEqual(['chia_sendTransaction', 'chia_getWallets']);
  });

  it('migrates legacy `allowedWcCommands` (bare names) into `commands` (wire form)', () => {
    // Records persisted under the previous shape stored bare WC names
    // (`sendTransaction`). New shape stores wire form (`chia_sendTransaction`).
    // Migration prepends the prefix so the gate's exact-match check works.
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = makePair({ topic: 'a' });
    delete (legacy as Partial<PairRecord>).commands;
    (legacy as unknown as { allowedWcCommands: unknown }).allowedWcCommands = [
      'sendTransaction',
      'getWallets',
    ];
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.commands).toEqual(['chia_sendTransaction', 'chia_getWallets']);
  });

  it('passes already-prefixed legacy entries through unchanged', () => {
    // Defensive: if someone hand-edited a legacy record to wire form, don't
    // double-prefix.
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = makePair({ topic: 'a' });
    delete (legacy as Partial<PairRecord>).commands;
    (legacy as unknown as { allowedWcCommands: unknown }).allowedWcCommands = ['chia_sendTransaction'];
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.commands).toEqual(['chia_sendTransaction']);
  });
});

describe('pairStore - bypass field migration', () => {
  // Records persisted before bypass landed have no `bypass` field. Default
  // to empty list — opt-in feature, not auto-enabled on upgrade.

  it('defaults to [] when the field is absent on disk', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = makePair({ topic: 'a' });
    delete (legacy as Partial<PairRecord>).bypass;
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.bypass).toEqual([]);
  });

  it('defaults to [] when the field is non-array on disk', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = makePair({ topic: 'a' });
    (legacy as unknown as { bypass: unknown }).bypass = { 0: 'chia_x' };
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

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

describe('pairStore - mainnet field migration', () => {
  // `mainnet` is required after the renderer's pair store stops being a
  // source of truth. Default to mainnet on legacy records — matches the
  // renderer's own historical default and is the safer choice (testnet
  // dapps are rare; users with existing testnet pairs should re-pair).

  it('defaults to true when the field is absent on disk', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = makePair({ topic: 'a' });
    delete (legacy as Partial<PairRecord>).mainnet;
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

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

describe('pairStore - notifications capability migration', () => {
  // Legacy records persisted before the notifications capability landed
  // have no `capabilities.notifications` field. Default to false — same
  // safe-deny stance as the other migrations: never silently expand dapp
  // reach across an upgrade.

  it('defaults to false when the field is absent on disk', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = makePair({ topic: 'a' });
    delete (legacy.grants.capabilities as Partial<typeof legacy.grants.capabilities>).notifications;
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.grants.capabilities.notifications).toBe(false);
  });

  it('coerces non-true values to false', () => {
    // Strict equality with `true` — a hand-edited string `"true"` or any
    // other truthy non-boolean is treated as denied, matching the
    // strict-equality contract elsewhere in the permission flow.
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = makePair({ topic: 'a' });
    (legacy.grants.capabilities as unknown as { notifications: unknown }).notifications = 'true';
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.grants.capabilities.notifications).toBe(false);
  });

  it('preserves an explicit true', () => {
    const store = loadStore();
    const pair = makePair({ topic: 'a' });
    pair.grants.capabilities.notifications = true;
    store.upsertPair(pair);

    const reload = loadStore();
    expect(reload.getPair('a')?.grants.capabilities.notifications).toBe(true);
  });
});

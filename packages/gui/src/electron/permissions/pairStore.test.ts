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

describe('pairStore - legacy capabilities → bypass migration', () => {
  // Pre-merge records carried `grants.capabilities.<bit>: true` and we
  // resolved permissions by reading those bits at runtime. Post-merge, the
  // bypass list is the only knob; capability bits expand into per-command
  // bypass entries on first read and the field is dropped on next write.

  function legacyPair(topic: string, capabilities: Record<string, boolean>, commands: string[], bypass: string[] = []) {
    return {
      topic,
      mainnet: true,
      metadata: { name: 'X' },
      fingerprints: [123],
      createdAt: 0,
      updatedAt: 0,
      spentMojos: '0',
      commands,
      bypass,
      grants: {
        capabilities: {
          balance: false,
          innocuous: false,
          sign: false,
          offer: false,
          spend: false,
          notifications: false,
          ...capabilities,
        },
        spendingMode: 'ask',
        spendingCapMojos: '0',
      },
    };
  }

  it('expands balance:true into bypass entries for granted balance commands', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = legacyPair('a', { balance: true }, ['chia_getWalletBalance', 'chia_getWalletBalances', 'chia_getWallets']);
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    const pair = reload.getPair('a');
    expect(pair?.bypass).toContain('chia_getWalletBalance');
    expect(pair?.bypass).toContain('chia_getWalletBalances');
    // chia_getWallets is innocuous, not balance — innocuous bit is false here.
    expect(pair?.bypass).not.toContain('chia_getWallets');
  });

  it('expands innocuous:true into bypass entries for granted innocuous commands', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = legacyPair('a', { innocuous: true }, ['chia_getWallets', 'chia_getNextAddress', 'chia_signMessageById']);
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    const pair = reload.getPair('a');
    expect(pair?.bypass).toContain('chia_getWallets');
    expect(pair?.bypass).toContain('chia_getNextAddress');
    // sign command is not in innocuous bucket; sign:false means no expansion.
    expect(pair?.bypass).not.toContain('chia_signMessageById');
  });

  it('expands sign:true into bypass entries for granted sign commands', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = legacyPair('a', { sign: true }, ['chia_signMessageByAddress', 'chia_signMessageById']);
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    const pair = reload.getPair('a');
    expect(pair?.bypass).toContain('chia_signMessageByAddress');
    expect(pair?.bypass).toContain('chia_signMessageById');
  });

  it('expands notifications:true into a single chia_showNotification entry', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = legacyPair('a', { notifications: true }, ['chia_showNotification', 'chia_getWallets']);
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.bypass).toContain('chia_showNotification');
  });

  it('only expands commands the dapp was actually granted (never silently broadens)', () => {
    // balance:true on a pair that was only granted send_transaction must
    // NOT add any balance commands — the registry knows what balance
    // commands exist but `commands` defines the dapp's reach.
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = legacyPair('a', { balance: true }, ['chia_sendTransaction']);
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.bypass).toEqual([]);
  });

  it('unions with any existing bypass entries (no duplicates, both preserved)', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = legacyPair(
      'a',
      { balance: true },
      ['chia_getWalletBalance', 'chia_logIn'],
      ['chia_logIn', 'chia_getWalletBalance'],
    );
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    const pair = reload.getPair('a');
    expect(pair?.bypass.sort()).toEqual(['chia_getWalletBalance', 'chia_logIn']);
  });

  it('drops the capabilities field from the in-memory record (next write persists clean)', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = legacyPair('a', { balance: true }, ['chia_getWalletBalance']);
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    const pair = reload.getPair('a');
    expect((pair?.grants as unknown as { capabilities?: unknown }).capabilities).toBeUndefined();
  });

  it('all capability bits false (or missing) leaves bypass exactly as on disk', () => {
    const file = path.join(mockTempDir, 'dapp-pairs.yaml');
    const legacy = legacyPair('a', {}, ['chia_getWalletBalance'], ['chia_getWalletBalance']);
    fs.writeFileSync(file, `pairs:\n  - ${JSON.stringify(legacy)}\n`);

    const reload = loadStore();
    expect(reload.getPair('a')?.bypass).toEqual(['chia_getWalletBalance']);
  });
});

describe('pairStore - resetBypass (single pair)', () => {
  it('clears a non-empty bypass list', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', bypass: ['chia_sendTransaction', 'chia_getWallets'] }));

    const updated = store.resetBypass('a');
    expect(updated?.bypass).toEqual([]);
    expect(store.getPair('a')?.bypass).toEqual([]);
  });

  it('persists across reloads', () => {
    // The whole point of the reset button is that it survives an app
    // restart. Reading from cache could pass even with a broken persist.
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', bypass: ['chia_sendTransaction'] }));
    store.resetBypass('a');

    const reload = loadStore();
    expect(reload.getPair('a')?.bypass).toEqual([]);
  });

  it('returns undefined for an unknown topic without persisting', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', bypass: ['chia_sendTransaction'] }));

    expect(store.resetBypass('nonexistent')).toBeUndefined();
    // Existing pair untouched.
    expect(store.getPair('a')?.bypass).toEqual(['chia_sendTransaction']);
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
    store.upsertPair(makePair({ topic: 'a', updatedAt: 100, bypass: ['chia_sendTransaction'] }));

    const before = Date.now();
    const result = store.resetBypass('a');
    const after = Date.now();

    expect(result?.updatedAt).toBeGreaterThanOrEqual(before);
    expect(result?.updatedAt).toBeLessThanOrEqual(after);
  });

  it('only touches the targeted pair, not siblings', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', bypass: ['chia_sendTransaction'] }));
    store.upsertPair(makePair({ topic: 'b', bypass: ['chia_getWallets'] }));

    store.resetBypass('a');
    expect(store.getPair('a')?.bypass).toEqual([]);
    expect(store.getPair('b')?.bypass).toEqual(['chia_getWallets']);
  });

  it('preserves the rest of the pair record (commands, fingerprints, grants)', () => {
    const store = loadStore();
    store.upsertPair(
      makePair({
        topic: 'a',
        bypass: ['chia_sendTransaction'],
        commands: ['chia_sendTransaction', 'chia_getWallets'],
        fingerprints: [111, 222],
        spentMojos: '500',
      }),
    );

    const result = store.resetBypass('a');
    expect(result?.commands).toEqual(['chia_sendTransaction', 'chia_getWallets']);
    expect(result?.fingerprints).toEqual([111, 222]);
    expect(result?.spentMojos).toBe('500');
  });
});

describe('pairStore - resetBypassAll (every pair)', () => {
  it('clears bypass on every pair', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', bypass: ['chia_sendTransaction'] }));
    store.upsertPair(makePair({ topic: 'b', bypass: ['chia_getWallets', 'chia_takeOffer'] }));
    store.upsertPair(makePair({ topic: 'c', bypass: [] }));

    store.resetBypassAll();
    expect(store.getPair('a')?.bypass).toEqual([]);
    expect(store.getPair('b')?.bypass).toEqual([]);
    expect(store.getPair('c')?.bypass).toEqual([]);
  });

  it('persists across reloads', () => {
    const store = loadStore();
    store.upsertPair(makePair({ topic: 'a', bypass: ['chia_sendTransaction'] }));
    store.upsertPair(makePair({ topic: 'b', bypass: ['chia_getWallets'] }));
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
    store.upsertPair(makePair({ topic: 'cleared', updatedAt: 100, bypass: ['chia_sendTransaction'] }));

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
        bypass: ['chia_sendTransaction'],
        commands: ['chia_sendTransaction'],
        fingerprints: [111],
        spentMojos: '500',
      }),
    );

    store.resetBypassAll();
    const pair = store.getPair('a');
    expect(pair?.commands).toEqual(['chia_sendTransaction']);
    expect(pair?.fingerprints).toEqual([111]);
    expect(pair?.spentMojos).toBe('500');
  });
});


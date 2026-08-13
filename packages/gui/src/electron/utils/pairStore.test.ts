import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { dump } from 'js-yaml';

import type { PairRecord } from './pairSchemas';

const mockGetName = jest.fn(() => 'Chia Test');

jest.mock('electron', () => ({
  app: {
    getName: mockGetName,
    getPath: jest.fn(() => ''),
    setPath: jest.fn(),
  },
}));

type PairStoreModule = typeof import('../utils/pairStore');

const originalChiaRoot = process.env.CHIA_ROOT;

let tmpRoot: string;

function loadStore(): PairStoreModule {
  let store: PairStoreModule | undefined;

  jest.isolateModules(() => {
    store = jest.requireActual<PairStoreModule>('./pairStore');
  });

  if (!store) {
    throw new Error('pairStore module failed to load');
  }

  return store;
}

function userDataDir() {
  return path.join(tmpRoot, 'gui', mockGetName());
}

function pairsPath() {
  return path.join(userDataDir(), 'dapp-pairs.yaml');
}

function seedPairs(pairs: unknown[]) {
  fs.mkdirSync(userDataDir(), { recursive: true });
  fs.writeFileSync(pairsPath(), dump({ pairs }), 'utf-8');
}

function makePair(overrides: Partial<PairRecord> = {}): PairRecord {
  return {
    topic: 'topic-1',
    mainnet: true,
    metadata: {
      name: 'Test dApp',
      url: 'https://example.com',
      icon: 'https://example.com/icon.png',
      description: 'Example',
    },
    fingerprint: 123_456,
    createdAt: 100,
    updatedAt: 100,
    commands: ['chia_takeOffer'],
    bypass: [],
    ...overrides,
  };
}

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockGetName.mockReturnValue('Chia Test');
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pair-store-'));
  process.env.CHIA_ROOT = tmpRoot;
  fs.mkdirSync(userDataDir(), { recursive: true });
});

afterEach(() => {
  process.env.CHIA_ROOT = originalChiaRoot;
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  jest.restoreAllMocks();
  jest.dontMock('../utils/userData');
});

describe('pairStore persistence and validation', () => {
  it('loads an empty list when the pairs file does not exist', () => {
    const store = loadStore();

    expect(store.getPairs()).toEqual([]);
  });

  it('returns a copy of the pair list', () => {
    seedPairs([makePair()]);
    const store = loadStore();

    const pairs = store.getPairs();
    pairs.push(makePair({ topic: 'topic-2' }));

    expect(store.getPairs()).toHaveLength(1);
  });

  it('drops invalid persisted records without blocking valid pairs', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    seedPairs([
      makePair(),
      {
        mainnet: true,
        metadata: { name: 'Missing topic' },
        fingerprint: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    ]);

    const store = loadStore();

    expect(store.getPairs()).toEqual([makePair()]);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid pair record'), expect.any(Error));
  });

  it('throws when user data has not been initialized', () => {
    jest.doMock('../utils/userData', () => ({
      getUserDataDir: () => undefined,
    }));
    const store = loadStore();

    expect(() => store.getPairs()).toThrow('userDataDir needs to be initialized');
  });

  it('adds a new pair with timestamps and zero used mojos', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const store = loadStore();

    const pair = store.addPair({
      topic: 'topic-1',
      mainnet: true,
      metadata: { name: 'Test dApp' },
      fingerprint: 123_456,
      commands: ['chia_takeOffer'],
      bypass: ['chia_takeOffer'],
    });

    expect(pair).toEqual({
      topic: 'topic-1',
      mainnet: true,
      metadata: { name: 'Test dApp' },
      fingerprint: 123_456,
      createdAt: 1000,
      updatedAt: 1000,
      commands: ['chia_takeOffer'],
      bypass: ['chia_takeOffer'],
    });
    expect(store.getPairs()).toEqual([pair]);
    nowSpy.mockRestore();
  });

  it('rejects duplicate pair topics', () => {
    seedPairs([makePair()]);
    const store = loadStore();

    expect(() =>
      store.addPair({
        topic: 'topic-1',
        mainnet: true,
        metadata: { name: 'Duplicate' },
        fingerprint: 123_456,
        commands: [],
        bypass: [],
      }),
    ).toThrow('Pair already exists: topic-1');
  });

  it('updates an existing pair and refreshes updatedAt', () => {
    jest.spyOn(Date, 'now').mockReturnValue(2000);
    seedPairs([makePair()]);
    const store = loadStore();

    const updated = store.updatePair('topic-1', {
      metadata: { name: 'Updated dApp' },
      commands: ['chia_sendTransaction'],
    });

    expect(updated).toMatchObject({
      topic: 'topic-1',
      metadata: { name: 'Updated dApp' },
      commands: ['chia_sendTransaction'],
      updatedAt: 2000,
    });
    expect(store.findPair('topic-1')).toEqual(updated);
  });

  it('throws when updating a missing pair', () => {
    const store = loadStore();

    expect(() => store.updatePair('missing', { commands: [] })).toThrow('Pair not found: missing');
  });

  it('removes a pair by topic', () => {
    seedPairs([makePair(), makePair({ topic: 'topic-2' })]);
    const store = loadStore();

    store.removePair('topic-1');

    expect(store.getPairs()).toEqual([makePair({ topic: 'topic-2' })]);
  });
});

describe('pairStore bypass reset', () => {
  it('adds a bypass command to a pair and refreshes updatedAt', () => {
    jest.spyOn(Date, 'now').mockReturnValue(2000);
    seedPairs([makePair({ bypass: ['chia_takeOffer'] })]);
    const store = loadStore();

    store.addBypassCommand('topic-1', 'chia_sendTransaction');

    expect(store.findPair('topic-1')).toMatchObject({
      bypass: ['chia_takeOffer', 'chia_sendTransaction'],
      updatedAt: 2000,
    });
  });

  it('does not duplicate an existing bypass command', () => {
    seedPairs([makePair({ bypass: ['chia_takeOffer'], updatedAt: 100 })]);
    const store = loadStore();

    store.addBypassCommand('topic-1', 'chia_takeOffer');

    expect(store.findPair('topic-1')).toMatchObject({
      bypass: ['chia_takeOffer'],
      updatedAt: 100,
    });
  });

  it('throws when adding a bypass command for a missing pair', () => {
    const store = loadStore();

    expect(() => store.addBypassCommand('missing', 'chia_takeOffer')).toThrow('Pair not found: missing');
  });

  it('throws when resetting bypass for a missing pair', () => {
    const store = loadStore();

    expect(() => store.resetBypass('missing')).toThrow('Pair not found: missing');
  });

  it('does not rewrite a pair that already has empty bypass permissions', () => {
    seedPairs([makePair({ bypass: [], updatedAt: 100 })]);
    const store = loadStore();

    store.resetBypass('topic-1');

    expect(store.findPair('topic-1')?.updatedAt).toBe(100);
  });

  it('clears bypass permissions for a single pair', () => {
    jest.spyOn(Date, 'now').mockReturnValue(2000);
    seedPairs([makePair({ bypass: ['chia_takeOffer'] })]);
    const store = loadStore();

    store.resetBypass('topic-1');

    expect(store.findPair('topic-1')).toMatchObject({
      bypass: [],
      updatedAt: 2000,
    });
  });

  it('clears bypass permissions for all pairs', () => {
    jest.spyOn(Date, 'now').mockReturnValue(3000);
    seedPairs([
      makePair({ topic: 'topic-1', bypass: ['chia_takeOffer'] }),
      makePair({ topic: 'topic-2', bypass: ['chia_sendTransaction'] }),
    ]);
    const store = loadStore();

    store.resetBypassAll();

    expect(store.getPairs()).toEqual([
      makePair({ topic: 'topic-1', bypass: [], updatedAt: 3000 }),
      makePair({ topic: 'topic-2', bypass: [], updatedAt: 3000 }),
    ]);
  });
});

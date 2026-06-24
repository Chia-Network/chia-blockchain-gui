import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { dump } from 'js-yaml';

import { WcErrorCode, type WcErrorCodeValue } from '../../@types/WcError';

import type { PairRecord } from './pairSchemas';

const mockGetName = jest.fn(() => 'Chia Test');

jest.mock('electron', () => ({
  app: {
    getName: mockGetName,
    getPath: jest.fn(() => ''),
    setPath: jest.fn(),
  },
}));

type AddDappBypassPermissionsModule = typeof import('./addDappBypassPermissions');
type PairStoreModule = typeof import('./pairStore');

const originalChiaRoot = process.env.CHIA_ROOT;
const bypassOptions = {
  canBypassCommand: (command: string) => ['chia_getWallets', 'chia_getWalletBalance', 'chia_showNotification'].includes(command),
};

let tmpRoot: string;

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
    },
    fingerprint: 123_456,
    createdAt: 100,
    updatedAt: 100,
    commands: ['chia_requestPermissions', 'chia_getWallets', 'chia_getWalletBalance', 'chia_showNotification'],
    bypass: ['chia_getWallets'],
    ...overrides,
  };
}

function loadModules(): { bypass: AddDappBypassPermissionsModule; store: PairStoreModule } {
  let bypass: AddDappBypassPermissionsModule | undefined;
  let store: PairStoreModule | undefined;

  jest.isolateModules(() => {
    bypass = jest.requireActual<AddDappBypassPermissionsModule>('./addDappBypassPermissions');
    store = jest.requireActual<PairStoreModule>('./pairStore');
  });

  if (!bypass || !store) {
    throw new Error('modules failed to load');
  }

  return { bypass, store };
}

function expectWcError(fn: () => unknown, message: string, code: WcErrorCodeValue = WcErrorCode.INVALID_PARAMS) {
  try {
    fn();
    throw new Error('Expected WcError');
  } catch (error) {
    expect(error).toMatchObject({
      code,
      message,
    });
  }
}

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockGetName.mockReturnValue('Chia Test');
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'add-dapp-bypass-permissions-'));
  process.env.CHIA_ROOT = tmpRoot;
  fs.mkdirSync(userDataDir(), { recursive: true });
});

afterEach(() => {
  process.env.CHIA_ROOT = originalChiaRoot;
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  jest.restoreAllMocks();
});

describe('addDappBypassPermissions', () => {
  it('adds supported requested commands to bypass permissions without changing pair grants', () => {
    jest.spyOn(Date, 'now').mockReturnValue(2000);
    seedPairs([makePair()]);
    const { bypass, store } = loadModules();
    const pair = store.findPair('topic-1');

    if (!pair) {
      throw new Error('pair not seeded');
    }

    expect(
      bypass.addDappBypassPermissions(
        pair,
        {
          commands: ['chia_getWalletBalance', 'chia_showNotification'],
        },
        bypassOptions,
      ),
    ).toEqual({
      success: true,
      commands: ['chia_getWalletBalance', 'chia_showNotification'],
    });

    expect(store.findPair('topic-1')).toMatchObject({
      commands: ['chia_requestPermissions', 'chia_getWallets', 'chia_getWalletBalance', 'chia_showNotification'],
      bypass: ['chia_getWallets', 'chia_getWalletBalance', 'chia_showNotification'],
      updatedAt: 2000,
    });
  });

  it('does not duplicate existing bypass permissions', () => {
    seedPairs([makePair()]);
    const { bypass, store } = loadModules();
    const pair = store.findPair('topic-1');

    if (!pair) {
      throw new Error('pair not seeded');
    }

    bypass.addDappBypassPermissions(
      pair,
      {
        commands: ['chia_getWallets'],
      },
      bypassOptions,
    );

    expect(store.findPair('topic-1')).toMatchObject({
      commands: ['chia_requestPermissions', 'chia_getWallets', 'chia_getWalletBalance', 'chia_showNotification'],
      bypass: ['chia_getWallets'],
    });
  });

  it('rejects already-granted dapp commands that do not allow confirmation bypass', () => {
    seedPairs([makePair({ commands: ['chia_requestPermissions', 'chia_sendTransaction', 'chia_logIn'] })]);
    const { bypass, store } = loadModules();
    const pair = store.findPair('topic-1');

    if (!pair) {
      throw new Error('pair not seeded');
    }

    expectWcError(
      () =>
        bypass.addDappBypassPermissions(
          pair,
          {
            commands: ['chia_sendTransaction'],
          },
          bypassOptions,
        ),
      'Command cannot bypass confirmation: chia_sendTransaction',
    );

    expect(store.findPair('topic-1')).toMatchObject({
      commands: ['chia_requestPermissions', 'chia_sendTransaction', 'chia_logIn'],
      bypass: ['chia_getWallets'],
    });
  });

  it('rejects invalid, duplicate, ungranted, and recursive bypass requests', () => {
    seedPairs([makePair()]);
    const { bypass, store } = loadModules();
    const pair = store.findPair('topic-1');

    if (!pair) {
      throw new Error('pair not seeded');
    }

    expectWcError(() => bypass.addDappBypassPermissions(pair, { commands: [] }, bypassOptions), 'commands are required');
    expectWcError(
      () => bypass.addDappBypassPermissions(pair, { commands: ['chia_getWallets', 'chia_getWallets'] }, bypassOptions),
      'Duplicate dapp command: chia_getWallets',
    );
    expectWcError(
      () => bypass.addDappBypassPermissions(pair, { commands: [' chia_getWallets'] }, bypassOptions),
      'Invalid dapp command:  chia_getWallets',
    );
    expectWcError(
      () => bypass.addDappBypassPermissions(pair, { commands: ['chia_unknownCommand'] }, bypassOptions),
      'Command not allowed for this pair: chia_unknownCommand',
      WcErrorCode.UNAUTHORIZED_METHOD,
    );
    expectWcError(
      () => bypass.addDappBypassPermissions(pair, { commands: ['chia_requestPermissions'] }, bypassOptions),
      'Cannot request chia_requestPermissions',
    );
  });
});

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { dump } from 'js-yaml';
import JSONbig from 'json-bigint';

import { WcErrorCode } from '../../@types/WcError';
import { parseDappParams } from '../commands/parseDappParams';

import type { PairRecord } from './pairSchemas';

const mockGetName = jest.fn(() => 'Chia Test');
const mockGetLoggedInFingerprint = jest.fn<Promise<number | undefined>, []>();
const mockIsMainnet = jest.fn<Promise<boolean>, []>();

jest.mock('electron', () => ({
  app: {
    getName: () => mockGetName(),
    getPath: jest.fn(() => ''),
    setPath: jest.fn(),
  },
}));

jest.mock('../api/getLoggedInFingerprint', () => ({
  getLoggedInFingerprint: mockGetLoggedInFingerprint,
}));

jest.mock('../api/isMainnet', () => ({
  isMainnet: mockIsMainnet,
}));

type DispatchPairRequest = typeof import('./dispatchPairRequest').dispatchPairRequest;

const originalChiaRoot = process.env.CHIA_ROOT;

let tmpRoot: string;

function userDataDir() {
  return path.join(tmpRoot, 'gui', mockGetName());
}

function pairsPath() {
  return path.join(userDataDir(), 'dapp-pairs.yaml');
}

function seedPairs(pairs: PairRecord[]) {
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
    commands: ['chia_sendTransaction'],
    bypass: [],
    ...overrides,
  };
}

function loadDispatchPairRequest(): DispatchPairRequest {
  return jest.requireActual<typeof import('./dispatchPairRequest')>('./dispatchPairRequest').dispatchPairRequest;
}

function makeHandlers<T>(result: T) {
  return {
    processRequest: jest.fn(async () => result),
    confirmRequest: jest.fn(async () => true),
  };
}

async function expectWcError(promise: Promise<unknown>, message: string, code: number) {
  await expect(promise).rejects.toMatchObject({
    name: 'WcError',
    message,
    code,
  });
}

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockGetName.mockReturnValue('Chia Test');
  mockGetLoggedInFingerprint.mockResolvedValue(123_456);
  mockIsMainnet.mockResolvedValue(true);
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-pair-request-'));
  process.env.CHIA_ROOT = tmpRoot;
  fs.mkdirSync(userDataDir(), { recursive: true });
});

afterEach(() => {
  process.env.CHIA_ROOT = originalChiaRoot;
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  jest.restoreAllMocks();
});

describe('dispatchPairRequest authorization', () => {
  it('rejects requests for unknown pair topics before any user confirmation or processing', async () => {
    const dispatchPairRequest = loadDispatchPairRequest();
    const { processRequest, confirmRequest } = makeHandlers('processed');

    await expectWcError(
      dispatchPairRequest('missing-topic', 'chia_sendTransaction', {}, processRequest, confirmRequest),
      'Pair not found',
      WcErrorCode.USER_REJECTED,
    );

    expect(processRequest).not.toHaveBeenCalled();
    expect(confirmRequest).not.toHaveBeenCalled();
  });

  it('rejects commands that were not granted to the pair', async () => {
    seedPairs([makePair({ commands: ['chia_getSyncStatus'] })]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const { processRequest, confirmRequest } = makeHandlers('processed');

    await expectWcError(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', {}, processRequest, confirmRequest),
      'Command not allowed for this pair.',
      WcErrorCode.UNAUTHORIZED_METHOD,
    );

    expect(processRequest).not.toHaveBeenCalled();
    expect(confirmRequest).not.toHaveBeenCalled();
  });

  it('rejects pairs created for a different network', async () => {
    seedPairs([makePair({ mainnet: false })]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const { processRequest, confirmRequest } = makeHandlers('processed');

    await expectWcError(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', {}, processRequest, confirmRequest),
      'Network mismatch',
      WcErrorCode.UNSUPPORTED_CHAINS,
    );

    expect(processRequest).not.toHaveBeenCalled();
    expect(confirmRequest).not.toHaveBeenCalled();
  });

  it('rejects missing, zero, malformed, and ungranted fingerprints', async () => {
    seedPairs([makePair({ fingerprint: 123_456 })]);
    const dispatchPairRequest = loadDispatchPairRequest();

    mockGetLoggedInFingerprint.mockResolvedValueOnce(undefined);
    await expectWcError(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', {}, jest.fn(), jest.fn()),
      'Fingerprint not allowed for this command',
      WcErrorCode.UNAUTHORIZED_METHOD,
    );

    mockGetLoggedInFingerprint.mockResolvedValueOnce(0);
    await expectWcError(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', { fingerprint: 0 }, jest.fn(), jest.fn()),
      'Fingerprint not allowed for this command',
      WcErrorCode.UNAUTHORIZED_METHOD,
    );

    await expectWcError(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', { fingerprint: '123456' }, jest.fn(), jest.fn()),
      'Fingerprint not allowed for this command',
      WcErrorCode.UNAUTHORIZED_METHOD,
    );

    await expectWcError(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', { fingerprint: 999_999 }, jest.fn(), jest.fn()),
      'Fingerprint not allowed for this command',
      WcErrorCode.UNAUTHORIZED_METHOD,
    );
  });

  it('allows an explicit granted fingerprint when it matches the logged-in fingerprint', async () => {
    seedPairs([makePair({ fingerprint: 123_456 })]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const { processRequest, confirmRequest } = makeHandlers('processed');

    await expect(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', { fingerprint: 123_456 }, processRequest, confirmRequest),
    ).resolves.toBe('processed');

    expect(confirmRequest).toHaveBeenCalledTimes(1);
    expect(processRequest).toHaveBeenCalledTimes(1);
  });

  it('passes the authorized pair and fingerprint to the processor', async () => {
    seedPairs([makePair({ fingerprint: 123_456 })]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const { processRequest, confirmRequest } = makeHandlers('processed');

    await dispatchPairRequest(
      'topic-1',
      'chia_sendTransaction',
      { fingerprint: 123_456 },
      processRequest,
      confirmRequest,
    );

    expect(processRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        fingerprint: 123_456,
        pair: expect.objectContaining({
          topic: 'topic-1',
          metadata: expect.objectContaining({ name: 'Test dApp' }),
          fingerprint: 123_456,
        }),
      }),
    );
  });

  it('rejects non-login commands when an explicit fingerprint differs from the logged-in fingerprint', async () => {
    mockGetLoggedInFingerprint.mockResolvedValue(999_999);
    seedPairs([makePair({ fingerprint: 123_456 })]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const { processRequest, confirmRequest } = makeHandlers('processed');

    await expectWcError(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', { fingerprint: 123_456 }, processRequest, confirmRequest),
      'Fingerprint not allowed for this command',
      WcErrorCode.UNAUTHORIZED_METHOD,
    );

    expect(confirmRequest).not.toHaveBeenCalled();
    expect(processRequest).not.toHaveBeenCalled();
  });

  it('rejects a dapp command when it tries to change the active fingerprint', async () => {
    mockGetLoggedInFingerprint.mockResolvedValue(999_999);
    seedPairs([makePair({ commands: ['chia_getPublicKey'], fingerprint: 123_456 })]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const { processRequest, confirmRequest } = makeHandlers('processed');

    await expectWcError(
      dispatchPairRequest('topic-1', 'chia_getPublicKey', { fingerprint: 123_456 }, processRequest, confirmRequest),
      'Fingerprint not allowed for this command',
      WcErrorCode.UNAUTHORIZED_METHOD,
    );

    expect(confirmRequest).not.toHaveBeenCalled();
    expect(processRequest).not.toHaveBeenCalled();
  });

  it('rejects a dapp command after production param parsing preserves a different fingerprint as a number', async () => {
    mockGetLoggedInFingerprint.mockResolvedValue(999_999);
    seedPairs([makePair({ commands: ['chia_getPublicKey'], fingerprint: 123_456 })]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const { processRequest, confirmRequest } = makeHandlers('processed');
    const parsedParams = parseDappParams('chia_getPublicKey', JSONbig.stringify({ fingerprint: 123_456 }));

    await expectWcError(
      dispatchPairRequest('topic-1', 'chia_getPublicKey', parsedParams, processRequest, confirmRequest),
      'Fingerprint not allowed for this command',
      WcErrorCode.UNAUTHORIZED_METHOD,
    );

    expect(parsedParams.fingerprint).toBe(123_456);
    expect(confirmRequest).not.toHaveBeenCalled();
    expect(processRequest).not.toHaveBeenCalled();
  });

  it('executes bypassed commands only after pair, command, network, and fingerprint checks pass', async () => {
    seedPairs([makePair({ bypass: ['chia_sendTransaction'] })]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const processRequest = jest.fn(async () => 'processed');
    const confirmRequest = jest.fn(async () => false);

    await expect(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', {}, processRequest, confirmRequest),
    ).resolves.toBe('processed');

    expect(confirmRequest).not.toHaveBeenCalled();
    expect(processRequest).toHaveBeenCalledTimes(1);
  });

  it('does not let bypass skip command grants', async () => {
    seedPairs([makePair({ commands: ['chia_getSyncStatus'], bypass: ['chia_sendTransaction'] })]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const processRequest = jest.fn(async () => 'processed');
    const confirmRequest = jest.fn(async () => true);

    await expectWcError(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', {}, processRequest, confirmRequest),
      'Command not allowed for this pair.',
      WcErrorCode.UNAUTHORIZED_METHOD,
    );

    expect(confirmRequest).not.toHaveBeenCalled();
    expect(processRequest).not.toHaveBeenCalled();
  });

  it('does not let bypass skip network checks', async () => {
    seedPairs([makePair({ mainnet: false, bypass: ['chia_sendTransaction'] })]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const processRequest = jest.fn(async () => 'processed');
    const confirmRequest = jest.fn(async () => true);

    await expectWcError(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', {}, processRequest, confirmRequest),
      'Network mismatch',
      WcErrorCode.UNSUPPORTED_CHAINS,
    );

    expect(confirmRequest).not.toHaveBeenCalled();
    expect(processRequest).not.toHaveBeenCalled();
  });

  it('does not let bypass skip fingerprint checks', async () => {
    mockGetLoggedInFingerprint.mockResolvedValue(999_999);
    seedPairs([makePair({ bypass: ['chia_sendTransaction'], fingerprint: 123_456 })]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const processRequest = jest.fn(async () => 'processed');
    const confirmRequest = jest.fn(async () => true);

    await expectWcError(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', { fingerprint: 123_456 }, processRequest, confirmRequest),
      'Fingerprint not allowed for this command',
      WcErrorCode.UNAUTHORIZED_METHOD,
    );

    expect(confirmRequest).not.toHaveBeenCalled();
    expect(processRequest).not.toHaveBeenCalled();
  });

  it('executes bypassed commands without manual confirmation', async () => {
    seedPairs([makePair({ bypass: ['chia_sendTransaction'] })]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const processRequest = jest.fn(async () => 'processed');
    const confirmRequest = jest.fn(async () => false);

    await expect(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', { amount: '25', fee: 5 }, processRequest, confirmRequest),
    ).resolves.toBe('processed');

    expect(confirmRequest).not.toHaveBeenCalled();
    expect(processRequest).toHaveBeenCalledTimes(1);
  });

  it('rejects when manual confirmation is denied', async () => {
    seedPairs([makePair()]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const processRequest = jest.fn(async () => 'processed');
    const confirmRequest = jest.fn(async () => false);

    await expectWcError(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', {}, processRequest, confirmRequest),
      'Command not allowed for this pair.',
      WcErrorCode.UNAUTHORIZED_METHOD,
    );

    expect(confirmRequest).toHaveBeenCalledTimes(1);
    expect(processRequest).not.toHaveBeenCalled();
  });

  it('rejects when the command is granted but the user denies manual confirmation', async () => {
    seedPairs([makePair({ commands: ['chia_sendTransaction'] })]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const processRequest = jest.fn(async () => 'processed');
    const confirmRequest = jest.fn(async () => false);

    await expectWcError(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', {}, processRequest, confirmRequest),
      'Command not allowed for this pair.',
      WcErrorCode.UNAUTHORIZED_METHOD,
    );

    expect(confirmRequest).toHaveBeenCalledTimes(1);
    expect(processRequest).not.toHaveBeenCalled();
  });

  it('propagates confirmation errors without processing the request', async () => {
    seedPairs([makePair()]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const processRequest = jest.fn(async () => 'processed');
    const confirmRequest = jest.fn(async () => {
      throw new Error('Operation cancelled by user');
    });

    await expect(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', {}, processRequest, confirmRequest),
    ).rejects.toThrow('Operation cancelled by user');

    expect(confirmRequest).toHaveBeenCalledTimes(1);
    expect(processRequest).not.toHaveBeenCalled();
  });

  it('propagates daemon fingerprint lookup failures before confirmation or processing', async () => {
    mockGetLoggedInFingerprint.mockRejectedValue(new Error('wallet daemon unavailable'));
    seedPairs([makePair()]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const processRequest = jest.fn(async () => 'processed');
    const confirmRequest = jest.fn(async () => true);

    await expect(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', {}, processRequest, confirmRequest),
    ).rejects.toThrow('wallet daemon unavailable');

    expect(confirmRequest).not.toHaveBeenCalled();
    expect(processRequest).not.toHaveBeenCalled();
  });

  it('propagates network lookup failures before confirmation or processing', async () => {
    mockIsMainnet.mockRejectedValue(new Error('network unavailable'));
    seedPairs([makePair()]);
    const dispatchPairRequest = loadDispatchPairRequest();
    const processRequest = jest.fn(async () => 'processed');
    const confirmRequest = jest.fn(async () => true);

    await expect(
      dispatchPairRequest('topic-1', 'chia_sendTransaction', {}, processRequest, confirmRequest),
    ).rejects.toThrow('network unavailable');

    expect(confirmRequest).not.toHaveBeenCalled();
    expect(processRequest).not.toHaveBeenCalled();
  });
});

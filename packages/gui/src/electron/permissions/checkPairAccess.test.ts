/**
 * `checkPairAccess` is the unified pair-bound gate. Every request that
 * reaches main against a paired dapp goes through it: pair existence,
 * commands allowlist, fingerprint allowlist, network match. Replaces
 * four previously scattered checks. A regression here lets a compromised
 * renderer bypass any of those four gates.
 */
import { WcErrorCode } from '../../@types/WcError';

import { checkPairAccess } from './checkPairAccess';
import type { PairRecord } from './types';

const TOPIC = 'topic-1';

function makePair(overrides: Partial<PairRecord> = {}): PairRecord {
  return {
    topic: TOPIC,
    mainnet: true,
    metadata: { name: 'Test Dapp' },
    fingerprints: [111, 222],
    createdAt: 0,
    updatedAt: 0,
    usedMojos: '0',
    commands: ['chia_sendTransaction', 'chia_getWallets'],
    bypass: [],
    grants: { xchMojos: '0' },
    ...overrides,
  };
}

function depsWith(pair?: PairRecord) {
  return {
    getPair: jest.fn((topic: string) => (pair && pair.topic === topic ? pair : undefined)),
  };
}

describe('checkPairAccess — happy path', () => {
  it('returns ok with the pair record when all checks pass', () => {
    const pair = makePair();
    const out = checkPairAccess(
      { topic: TOPIC, wcCommand: 'chia_sendTransaction', fingerprint: 111, mainnet: true },
      depsWith(pair),
    );
    expect(out).toEqual({ ok: true, pair });
  });

  it('passes when fingerprint is omitted (caller has no fingerprint context)', () => {
    const out = checkPairAccess(
      { topic: TOPIC, wcCommand: 'chia_sendTransaction', mainnet: true },
      depsWith(makePair()),
    );
    expect(out.ok).toBe(true);
  });
});

describe('checkPairAccess — failure modes', () => {
  it('denies "unknown pair" when topic is not in the store', () => {
    const out = checkPairAccess({ topic: TOPIC, wcCommand: 'chia_sendTransaction' }, depsWith(undefined));
    expect(out).toEqual({ ok: false, reason: 'Pair not found', code: WcErrorCode.USER_REJECTED });
  });

  it('denies "missing wc command" when wcCommand is empty / undefined', () => {
    const pair = makePair();
    expect(checkPairAccess({ topic: TOPIC }, depsWith(pair))).toEqual({
      ok: false,
      reason: 'missing wc command',
      code: WcErrorCode.INVALID_PARAMS,
    });
    expect(checkPairAccess({ topic: TOPIC, wcCommand: '' }, depsWith(pair))).toEqual({
      ok: false,
      reason: 'missing wc command',
      code: WcErrorCode.INVALID_PARAMS,
    });
  });

  it('denies when wcCommand is not on the pair allowlist', () => {
    const out = checkPairAccess(
      { topic: TOPIC, wcCommand: 'chia_signMessageByAddress' },
      depsWith(makePair({ commands: ['chia_getWallets'] })),
    );
    expect(out).toEqual({
      ok: false,
      reason: 'command not granted for this pair: chia_signMessageByAddress',
      code: WcErrorCode.UNAUTHORIZED_METHOD,
    });
  });

  it('denies when the dapp-claimed fingerprint is not on the pair list', () => {
    const out = checkPairAccess(
      { topic: TOPIC, wcCommand: 'chia_sendTransaction', fingerprint: 999 },
      depsWith(makePair({ fingerprints: [111, 222] })),
    );
    expect(out).toEqual({
      ok: false,
      reason: 'fingerprint not granted for this pair: 999',
      code: WcErrorCode.UNAUTHORIZED_METHOD,
    });
  });

  it('denies on mainnet/testnet mismatch (mainnet pair, testnet request)', () => {
    const out = checkPairAccess(
      { topic: TOPIC, wcCommand: 'chia_sendTransaction', mainnet: false },
      depsWith(makePair({ mainnet: true })),
    );
    expect(out).toEqual({ ok: false, reason: 'network mismatch', code: WcErrorCode.UNSUPPORTED_CHAINS });
  });

  it('denies on mainnet/testnet mismatch (testnet pair, mainnet request)', () => {
    const out = checkPairAccess(
      { topic: TOPIC, wcCommand: 'chia_sendTransaction', mainnet: true },
      depsWith(makePair({ mainnet: false })),
    );
    expect(out).toEqual({ ok: false, reason: 'network mismatch', code: WcErrorCode.UNSUPPORTED_CHAINS });
  });

  // Fail-closed on missing/non-boolean mainnet: every dapp call is
  // network-scoped, so a renderer that omits the flag (or sends a non-bool)
  // must NOT slip past the network gate.
  it('denies when mainnet is undefined (caller never set the flag)', () => {
    const out = checkPairAccess(
      { topic: TOPIC, wcCommand: 'chia_sendTransaction' } as Parameters<typeof checkPairAccess>[0],
      depsWith(makePair({ mainnet: true })),
    );
    expect(out).toEqual({ ok: false, reason: 'network mismatch', code: WcErrorCode.UNSUPPORTED_CHAINS });
  });

  it('denies when mainnet is not a boolean (string, null, etc.)', () => {
    expect(
      checkPairAccess(
        { topic: TOPIC, wcCommand: 'chia_sendTransaction', mainnet: 'true' as unknown as boolean },
        depsWith(makePair({ mainnet: true })),
      ),
    ).toEqual({ ok: false, reason: 'network mismatch', code: WcErrorCode.UNSUPPORTED_CHAINS });
    expect(
      checkPairAccess(
        { topic: TOPIC, wcCommand: 'chia_sendTransaction', mainnet: null as unknown as boolean },
        depsWith(makePair({ mainnet: true })),
      ),
    ).toEqual({ ok: false, reason: 'network mismatch', code: WcErrorCode.UNSUPPORTED_CHAINS });
  });
});

describe('checkPairAccess — order of failures', () => {
  // The function returns the first failure it encounters. This matters
  // for the user-facing error message — if multiple things are wrong,
  // the message should point at the most specific reason.

  it('"unknown pair" wins over wcCommand / fingerprint / mainnet', () => {
    const out = checkPairAccess(
      { topic: 'no-such', wcCommand: 'chia_X', fingerprint: 9, mainnet: false },
      depsWith(makePair()),
    );
    expect(out).toMatchObject({ reason: 'Pair not found' });
  });

  it('"missing wc command" wins over fingerprint / mainnet', () => {
    const out = checkPairAccess({ topic: TOPIC, fingerprint: 999, mainnet: false }, depsWith(makePair()));
    expect(out).toMatchObject({ reason: 'missing wc command' });
  });

  it('"command not granted" wins over fingerprint / mainnet', () => {
    const out = checkPairAccess(
      { topic: TOPIC, wcCommand: 'chia_unknownCmd', fingerprint: 999, mainnet: false },
      depsWith(makePair()),
    );
    expect(out).toMatchObject({ reason: expect.stringContaining('command not granted') });
  });

  it('"fingerprint not granted" wins over mainnet mismatch', () => {
    const out = checkPairAccess(
      { topic: TOPIC, wcCommand: 'chia_sendTransaction', fingerprint: 999, mainnet: false },
      depsWith(makePair({ mainnet: true })),
    );
    expect(out).toMatchObject({ reason: expect.stringContaining('fingerprint not granted') });
  });
});

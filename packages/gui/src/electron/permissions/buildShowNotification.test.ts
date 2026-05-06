/**
 * `buildShowNotification` is the only place a dapp's payload becomes a
 * Notification that the user sees. It runs in main right after the
 * `pair.commands` gate passes, so its inputs are renderer-supplied (and
 * therefore untrusted). Pin every output shape and every malformed-input
 * rejection.
 */
import { buildShowNotification } from './buildShowNotification';
import type { PairRecord } from './types';

function makePair(overrides: Partial<PairRecord> = {}): PairRecord {
  return {
    topic: 'topic-1',
    mainnet: true,
    metadata: { name: 'Test Dapp' },
    fingerprints: [111, 222],
    createdAt: 0,
    updatedAt: 0,
    usedMojos: '0',
    commands: ['chia_showNotification'],
    bypass: [],
    grants: { xchMojos: '0' },
    ...overrides,
  };
}

describe('buildShowNotification — offer notifications', () => {
  it('builds an offer notification from a valid payload', () => {
    const out = buildShowNotification(makePair(), { type: 'offer', offerData: 'offer1abc...' }, 111);
    expect(out).toMatchObject({
      type: 'offer',
      offerData: 'offer1abc...',
      from: 'Test Dapp',
      source: 'WALLET_CONNECT',
      fingerprints: [111],
    });
    expect(typeof out!.timestamp).toBe('number');
    expect(typeof out!.id).toBe('string');
    expect(out!.id).toMatch(/^wc-/);
  });

  it('rejects an offer notification with missing offerData', () => {
    const out = buildShowNotification(makePair(), { type: 'offer' }, 111);
    expect(out).toBeNull();
  });

  it('rejects an offer notification with non-string offerData', () => {
    const out = buildShowNotification(makePair(), { type: 'offer', offerData: 42 }, 111);
    expect(out).toBeNull();
  });

  it('rejects an offer notification with empty-string offerData', () => {
    const out = buildShowNotification(makePair(), { type: 'offer', offerData: '' }, 111);
    expect(out).toBeNull();
  });
});

describe('buildShowNotification — announcement notifications', () => {
  it('builds an announcement with message + url', () => {
    const out = buildShowNotification(
      makePair(),
      { type: 'announcement', message: 'Hello', url: 'https://example.com' },
      222,
    );
    expect(out).toMatchObject({
      type: 'announcement',
      message: 'Hello',
      url: 'https://example.com',
      from: 'Test Dapp',
      fingerprints: [222],
    });
  });

  it('builds an announcement with message only (url undefined)', () => {
    const out = buildShowNotification(makePair(), { type: 'announcement', message: 'Hello' }, 111);
    expect(out).toMatchObject({ type: 'announcement', message: 'Hello' });
    expect((out as { url?: string }).url).toBeUndefined();
  });

  it('drops a non-string url field', () => {
    const out = buildShowNotification(makePair(), { type: 'announcement', message: 'Hello', url: 42 }, 111);
    expect((out as { url?: string }).url).toBeUndefined();
  });

  it('drops an empty-string url', () => {
    const out = buildShowNotification(makePair(), { type: 'announcement', message: 'Hello', url: '' }, 111);
    expect((out as { url?: string }).url).toBeUndefined();
  });

  it('rejects an announcement with missing message', () => {
    const out = buildShowNotification(makePair(), { type: 'announcement' }, 111);
    expect(out).toBeNull();
  });

  it('rejects an announcement with non-string message', () => {
    const out = buildShowNotification(makePair(), { type: 'announcement', message: 42 }, 111);
    expect(out).toBeNull();
  });
});

describe('buildShowNotification — fingerprint resolution', () => {
  it('uses just the request fingerprint when allFingerprints is omitted', () => {
    const out = buildShowNotification(
      makePair({ fingerprints: [111, 222, 333] }),
      { type: 'announcement', message: 'Hi' },
      222,
    );
    expect(out!.fingerprints).toEqual([222]);
  });

  it('uses every paired fingerprint when allFingerprints is true', () => {
    const out = buildShowNotification(
      makePair({ fingerprints: [111, 222, 333] }),
      { type: 'announcement', message: 'Hi', allFingerprints: true },
      222,
    );
    expect(out!.fingerprints).toEqual([111, 222, 333]);
  });

  it('falls back to pair.fingerprints when no request fingerprint and no allFingerprints', () => {
    const out = buildShowNotification(
      makePair({ fingerprints: [111, 222] }),
      { type: 'announcement', message: 'Hi' },
      undefined,
    );
    expect(out!.fingerprints).toEqual([111, 222]);
  });

  it('treats allFingerprints non-true values as false (strict ===)', () => {
    // A hostile dapp can't sneak `allFingerprints: 'true'` to broaden the
    // notification scope.
    const out = buildShowNotification(
      makePair({ fingerprints: [111, 222, 333] }),
      { type: 'announcement', message: 'Hi', allFingerprints: 'true' },
      222,
    );
    expect(out!.fingerprints).toEqual([222]);
  });
});

describe('buildShowNotification — unknown / malformed types', () => {
  it.each([
    ['unknown type', { type: 'random', message: 'x' }],
    ['missing type', { message: 'x' }],
    ['null type', { type: null, message: 'x' }],
    ['number type', { type: 42, message: 'x' }],
  ])('returns null for %s', (_label, payload) => {
    const out = buildShowNotification(makePair(), payload as Record<string, unknown>, 111);
    expect(out).toBeNull();
  });
});

describe('buildShowNotification — pair metadata', () => {
  it('falls back to from: undefined when pair has no metadata.name', () => {
    const out = buildShowNotification(
      makePair({ metadata: { name: '' } }),
      { type: 'announcement', message: 'Hi' },
      111,
    );
    // The renderer's notification UI handles undefined/empty from with its
    // own "Unknown Dapp" fallback; main just passes through whatever the
    // pair record holds.
    expect(out!.from).toBe('');
  });
});

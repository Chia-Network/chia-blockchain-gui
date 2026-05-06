/**
 * The Confirm dialog's "Don't ask again" checkbox is the only place a dapp
 * can ever earn silent approval for a sensitive command. The
 * result-shape interpretation in `captureBypassFromConfirmResult` decides
 * whether that approval is persisted — getting any of the four result
 * cases wrong either annoys the user (lost bypass) or silently extends
 * dapp reach (bypass written when user said cancel / didn't tick the
 * box). These tests pin every shape.
 */
import { captureBypassFromConfirmResult } from './bypassCapture';
import type { PairRecord } from './types';

const TOPIC = 'topic-1';
const WC_COMMAND = 'chia_signMessageByAddress';

function makePair(overrides: { bypass?: string[] } = {}): PairRecord {
  return {
    topic: TOPIC,
    mainnet: true,
    metadata: { name: 'Test Dapp' },
    fingerprints: [123],
    createdAt: 0,
    updatedAt: 0,
    usedMojos: '0',
    commands: ['chia_signMessageByAddress', 'chia_getWallets'],
    bypass: overrides.bypass ?? [],
    grants: { xchMojos: '0' },
  };
}

function makeDeps(initialPair?: PairRecord) {
  let pair = initialPair;
  const upsertPair = jest.fn((next: PairRecord) => {
    pair = next;
  });
  return {
    getPair: jest.fn((topic: string) => (pair && pair.topic === topic ? pair : undefined)),
    upsertPair,
    currentPair: () => pair,
  };
}

describe('captureBypassFromConfirmResult — no-op result shapes', () => {
  it.each([
    ['undefined', undefined],
    ['null', null],
    ['false (cancel)', false],
    ['true (confirm without form fields)', true],
    ['number', 42],
    ['string', 'bypass'],
  ])('returns null and does not call upsertPair for %s', (_label, result) => {
    const deps = makeDeps(makePair());
    const out = captureBypassFromConfirmResult(result, { topic: TOPIC, wcCommand: WC_COMMAND }, deps);
    expect(out).toBeNull();
    expect(deps.upsertPair).not.toHaveBeenCalled();
  });

  it('object with no bypass field is no-op', () => {
    const deps = makeDeps(makePair());
    const out = captureBypassFromConfirmResult({}, { topic: TOPIC, wcCommand: WC_COMMAND }, deps);
    expect(out).toBeNull();
    expect(deps.upsertPair).not.toHaveBeenCalled();
  });

  it('object with bypass: false is no-op (user unchecked the box)', () => {
    const deps = makeDeps(makePair());
    const out = captureBypassFromConfirmResult({ bypass: false }, { topic: TOPIC, wcCommand: WC_COMMAND }, deps);
    expect(out).toBeNull();
    expect(deps.upsertPair).not.toHaveBeenCalled();
  });

  it.each([
    ['string "true"', 'true'],
    ['number 1', 1],
    ['object {}', {}],
  ])('object with truthy-but-not-true bypass (%s) is no-op (strict ===)', (_label, value) => {
    // Strict equality with `true` prevents a hostile renderer from sneaking
    // a string `'true'` past the check; only the literal boolean from the
    // checkbox's `el.checked` collection counts.
    const deps = makeDeps(makePair());
    const out = captureBypassFromConfirmResult({ bypass: value }, { topic: TOPIC, wcCommand: WC_COMMAND }, deps);
    expect(out).toBeNull();
    expect(deps.upsertPair).not.toHaveBeenCalled();
  });
});

describe('captureBypassFromConfirmResult — persistence path', () => {
  it('appends wcCommand to bypass and bumps updatedAt', () => {
    const deps = makeDeps(makePair({ bypass: ['chia_getWallets'] }));
    const before = Date.now();
    const out = captureBypassFromConfirmResult({ bypass: true }, { topic: TOPIC, wcCommand: WC_COMMAND }, deps);
    const after = Date.now();
    expect(out).toEqual(['chia_getWallets', WC_COMMAND]);
    expect(deps.upsertPair).toHaveBeenCalledTimes(1);
    const written = deps.upsertPair.mock.calls[0][0];
    expect(written.bypass).toEqual(['chia_getWallets', WC_COMMAND]);
    expect(written.updatedAt).toBeGreaterThanOrEqual(before);
    expect(written.updatedAt).toBeLessThanOrEqual(after);
  });

  it('preserves all other fields (topic, mainnet, grants, commands, usedMojos)', () => {
    const original = makePair({ bypass: [] });
    const deps = makeDeps(original);
    captureBypassFromConfirmResult({ bypass: true }, { topic: TOPIC, wcCommand: WC_COMMAND }, deps);
    const written = deps.upsertPair.mock.calls[0][0];
    expect(written.topic).toBe(original.topic);
    expect(written.mainnet).toBe(original.mainnet);
    expect(written.metadata).toEqual(original.metadata);
    expect(written.fingerprints).toEqual(original.fingerprints);
    expect(written.commands).toEqual(original.commands);
    expect(written.usedMojos).toBe(original.usedMojos);
    expect(written.grants).toEqual(original.grants);
    expect(written.createdAt).toBe(original.createdAt);
  });

  it('idempotent: appending an already-bypassed command does not duplicate or write', () => {
    const deps = makeDeps(makePair({ bypass: [WC_COMMAND] }));
    const out = captureBypassFromConfirmResult({ bypass: true }, { topic: TOPIC, wcCommand: WC_COMMAND }, deps);
    expect(out).toEqual([WC_COMMAND]);
    // Crucially: no write happens. Otherwise an attacker could keep
    // bumping updatedAt on someone else's pair record by re-issuing
    // already-bypassed commands.
    expect(deps.upsertPair).not.toHaveBeenCalled();
  });

  it('returns null and does not write when pair is missing (race with revoke)', () => {
    const deps = makeDeps(undefined);
    const out = captureBypassFromConfirmResult({ bypass: true }, { topic: TOPIC, wcCommand: WC_COMMAND }, deps);
    expect(out).toBeNull();
    expect(deps.upsertPair).not.toHaveBeenCalled();
  });

  it('matches by exact topic — wrong topic does not write', () => {
    const deps = makeDeps(makePair());
    const out = captureBypassFromConfirmResult(
      { bypass: true },
      { topic: 'different-topic', wcCommand: WC_COMMAND },
      deps,
    );
    expect(out).toBeNull();
    expect(deps.upsertPair).not.toHaveBeenCalled();
  });

  it('captures wire-form wcCommand verbatim (no prefix mangling)', () => {
    // Both the dispatch path and the gate compare wcCommand strings
    // directly. Captured bypass entries must match the same shape, or the
    // gate's `pair.bypass.includes(wc)` would never hit on the next call.
    const deps = makeDeps(makePair());
    captureBypassFromConfirmResult({ bypass: true }, { topic: TOPIC, wcCommand: 'chia_spendCAT' }, deps);
    expect(deps.upsertPair.mock.calls[0][0].bypass).toEqual(['chia_spendCAT']);
  });
});

import BigNumber from 'bignumber.js';

import { resolvePermission, toWire } from './permissions';
import { getPair, recordSpend } from './pairStore';
import type { CapabilityGrants, Decision, PairRecord, SpendingMode } from './types';

jest.mock('./pairStore', () => ({
  getPair: jest.fn(),
  recordSpend: jest.fn(),
}));

const mockGetPair = getPair as jest.MockedFunction<typeof getPair>;
const mockRecordSpend = recordSpend as jest.MockedFunction<typeof recordSpend>;

const TOPIC = 'topic-1';
const PAIR_PRINCIPAL = { kind: 'pair' as const, topic: TOPIC };
const UI_PRINCIPAL = { kind: 'ui' as const };

function makeCapabilities(overrides: Partial<CapabilityGrants> = {}): CapabilityGrants {
  return {
    read: true,
    balance: false,
    innocuous: false,
    sign: false,
    offer: false,
    spend: false,
    ...overrides,
  };
}

function makePair(
  overrides: {
    capabilities?: Partial<CapabilityGrants>;
    spendingMode?: SpendingMode;
    spendingCapMojos?: string;
    spentMojos?: string;
    metadata?: Partial<PairRecord['metadata']>;
  } = {},
): PairRecord {
  return {
    topic: TOPIC,
    metadata: { name: 'Test Dapp', ...overrides.metadata },
    fingerprints: [123],
    createdAt: 0,
    updatedAt: 0,
    spentMojos: overrides.spentMojos ?? '0',
    grants: {
      capabilities: makeCapabilities(overrides.capabilities),
      spendingMode: overrides.spendingMode ?? 'ask',
      spendingCapMojos: overrides.spendingCapMojos ?? '0',
    },
  };
}

function expectAllow(d: Decision): Extract<Decision, { kind: 'allow' }> {
  expect(d.kind).toBe('allow');
  return d as Extract<Decision, { kind: 'allow' }>;
}

beforeEach(() => {
  mockGetPair.mockReset();
  mockRecordSpend.mockReset();
});

describe('resolvePermission - UI principal', () => {
  it('allows commands present in AllowedCommands', () => {
    expect(resolvePermission(UI_PRINCIPAL, 'chia_wallet.get_wallets', {}).kind).toBe('allow');
  });

  it('prompts for commands not in AllowedCommands', () => {
    expect(resolvePermission(UI_PRINCIPAL, 'chia_wallet.send_transaction', {})).toEqual({
      kind: 'prompt',
      reason: 'requires user confirmation',
      pair: undefined,
    });
  });

  it('does not consult the pair store', () => {
    resolvePermission(UI_PRINCIPAL, 'chia_wallet.send_transaction', {});
    expect(mockGetPair).not.toHaveBeenCalled();
  });

  it('UI allow has a no-op commit (cannot debit a UI principal)', () => {
    const d = expectAllow(resolvePermission(UI_PRINCIPAL, 'chia_wallet.get_wallets', {}));
    d.commit();
    d.commit();
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });
});

describe('resolvePermission - unknown pair topic', () => {
  it('denies before evaluating any command-specific rules', () => {
    mockGetPair.mockReturnValue(undefined);
    expect(resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallets', {})).toEqual({
      kind: 'deny',
      reason: 'unknown pair',
    });
  });

  it('denies even for sensitive commands', () => {
    mockGetPair.mockReturnValue(undefined);
    expect(resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.delete_key', {})).toEqual({
      kind: 'deny',
      reason: 'unknown pair',
    });
  });
});

describe('resolvePermission - pair context shape', () => {
  it('attaches dialog-shaped pair info to prompt decisions, never the raw record', () => {
    const pair = makePair({ metadata: { name: 'My Dapp', url: 'https://app.example' } });
    mockGetPair.mockReturnValue(pair);
    const d = resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallets', {});
    expect(d).toEqual({
      kind: 'prompt',
      reason: 'innocuous not pre-approved',
      pair: { topic: TOPIC, name: 'My Dapp', url: 'https://app.example' },
    });
  });

  it('omits pair on UI prompts', () => {
    const d = resolvePermission(UI_PRINCIPAL, 'chia_wallet.send_transaction', {});
    expect(d).toEqual({ kind: 'prompt', reason: 'requires user confirmation', pair: undefined });
  });

  it('omits pair on deny ("unknown pair")', () => {
    mockGetPair.mockReturnValue(undefined);
    expect(resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.send_transaction', {})).toEqual({
      kind: 'deny',
      reason: 'unknown pair',
    });
  });
});

describe('resolvePermission - balance commands', () => {
  it('allows when balance capability granted', () => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { balance: true } }));
    expect(resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallet_balance', {}).kind).toBe('allow');
    expect(resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallet_balances', {}).kind).toBe('allow');
  });

  it('prompts when balance capability missing', () => {
    mockGetPair.mockReturnValue(makePair());
    const d = resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallet_balance', {});
    expect(d.kind).toBe('prompt');
    expect((d as Extract<Decision, { kind: 'prompt' }>).reason).toBe('balance not pre-approved');
  });

  it('balance allow has no-op commit (read-only command)', () => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { balance: true } }));
    const d = expectAllow(resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallet_balance', {}));
    d.commit();
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });
});

describe('resolvePermission - push_transactions', () => {
  const CMD = 'chia_wallet.push_transactions';

  it.each([
    ['true', true],
    ['string "true"', 'true'],
    ['string "false"', 'false'],
    ['number 1', 1],
    ['object {}', {}],
  ])('prompts when sign is truthy via %s (Python truthiness)', (_label, sign) => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { innocuous: true } }));
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, { sign })).toMatchObject({
      kind: 'prompt',
      reason: 'signing requested',
    });
  });

  it('prompts when innocuous capability is missing', () => {
    mockGetPair.mockReturnValue(makePair());
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, {})).toMatchObject({
      kind: 'prompt',
      reason: 'innocuous actions not pre-approved',
    });
  });

  it.each([
    ['omitted', undefined],
    ['false', false],
    ['number 0', 0],
    ['null', null],
  ])('allows when sign is falsy via %s and innocuous granted', (_label, sign) => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { innocuous: true } }));
    const payload = sign === undefined ? {} : { sign };
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, payload).kind).toBe('allow');
  });

  it('allows when fee fits in remaining budget and debits only the fee on commit', () => {
    mockGetPair.mockReturnValue(
      makePair({
        capabilities: { innocuous: true },
        spendingCapMojos: '1000',
        spentMojos: '200',
      }),
    );
    const d = expectAllow(resolvePermission(PAIR_PRINCIPAL, CMD, { fee: '500' }));
    d.commit();
    expect(mockRecordSpend).toHaveBeenCalledTimes(1);
    const [topic, mojos] = mockRecordSpend.mock.calls[0];
    expect(topic).toBe(TOPIC);
    expect(mojos.toFixed(0)).toBe('500');
  });

  it('allows when spent + fee equals cap exactly', () => {
    mockGetPair.mockReturnValue(
      makePair({ capabilities: { innocuous: true }, spendingCapMojos: '1000', spentMojos: '400' }),
    );
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, { fee: '600' }).kind).toBe('allow');
  });

  it('prompts when fee exceeds remaining budget', () => {
    mockGetPair.mockReturnValue(
      makePair({ capabilities: { innocuous: true }, spendingCapMojos: '1000', spentMojos: '900' }),
    );
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, { fee: '200' })).toMatchObject({
      kind: 'prompt',
      reason: 'push fee exceeds remaining budget',
    });
  });

  it('treats negative fee as zero (cannot reduce spend)', () => {
    mockGetPair.mockReturnValue(
      makePair({ capabilities: { innocuous: true }, spendingCapMojos: '0', spentMojos: '0' }),
    );
    const d = expectAllow(resolvePermission(PAIR_PRINCIPAL, CMD, { fee: '-100' }));
    d.commit();
    // Negative fee is sanitized to undefined, which becomes ZERO; commit
    // resolves to a zero-debit and never reaches recordSpend.
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('does not record on commit when fee is zero or missing', () => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { innocuous: true } }));
    expectAllow(resolvePermission(PAIR_PRINCIPAL, CMD, {})).commit();
    expectAllow(resolvePermission(PAIR_PRINCIPAL, CMD, { fee: '0' })).commit();
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('preserves precision beyond JS safe-integer range', () => {
    const cap = '99999999999999999999';
    const fee = '99999999999999999999';
    mockGetPair.mockReturnValue(
      makePair({ capabilities: { innocuous: true }, spendingCapMojos: cap, spentMojos: '0' }),
    );
    const d = expectAllow(resolvePermission(PAIR_PRINCIPAL, CMD, { fee }));
    d.commit();
    const [, mojos] = mockRecordSpend.mock.calls[0];
    expect(mojos.toFixed(0)).toBe(fee);
    expect(mojos).toBeInstanceOf(BigNumber);
  });
});

describe('resolvePermission - innocuous-classified commands', () => {
  it('allows when innocuous granted', () => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { innocuous: true } }));
    expect(resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallets', {}).kind).toBe('allow');
    expect(
      resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.get_coin_records_by_names', {}).kind,
    ).toBe('allow');
  });

  it('prompts when innocuous not granted', () => {
    mockGetPair.mockReturnValue(makePair());
    expect(resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallets', {})).toMatchObject({
      kind: 'prompt',
      reason: 'innocuous not pre-approved',
    });
  });

  it('innocuous allow has no-op commit', () => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { innocuous: true } }));
    expectAllow(resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallets', {})).commit();
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });
});

describe('resolvePermission - sign-classified commands', () => {
  it('allows when sign granted', () => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { sign: true } }));
    expect(
      resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.sign_message_by_address', {}).kind,
    ).toBe('allow');
    expect(
      resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.sign_message_by_id', {}).kind,
    ).toBe('allow');
  });

  it('prompts when sign not granted', () => {
    mockGetPair.mockReturnValue(makePair());
    expect(
      resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.sign_message_by_address', {}),
    ).toMatchObject({ kind: 'prompt', reason: 'sign not pre-approved' });
  });
});

describe('resolvePermission - unclassified / sensitive commands', () => {
  it.each([
    'chia_wallet.delete_key',
    'chia_wallet.cat_spend',
    'chia_wallet.nft_transfer_nft',
    'chia_wallet.take_offer',
    'chia_wallet.cancel_offer',
    'chia_harvester.delete_plot',
    'chia_full_node.open_connection',
    'totally.unknown_command',
  ])('prompts with "sensitive command" for %s', (cmd) => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { innocuous: true, sign: true } }));
    expect(resolvePermission(PAIR_PRINCIPAL, cmd, {})).toMatchObject({
      kind: 'prompt',
      reason: 'sensitive command',
    });
  });
});

describe('resolvePermission - send_transaction (spend)', () => {
  const CMD = 'chia_wallet.send_transaction';

  it('denies when spendingMode is block', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'block', spendingCapMojos: '999' }));
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, { amount: '10' })).toEqual({
      kind: 'deny',
      reason: 'spending blocked for this app',
    });
  });

  it('prompts when spendingMode is ask', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'ask', spendingCapMojos: '999' }));
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, { amount: '10' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('allows under cap and debits amount + fee on commit', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    const d = expectAllow(resolvePermission(PAIR_PRINCIPAL, CMD, { amount: '700', fee: '50' }));
    d.commit();
    const [topic, mojos] = mockRecordSpend.mock.calls[0];
    expect(topic).toBe(TOPIC);
    expect(mojos.toFixed(0)).toBe('750');
  });

  it('commit is idempotent (second call no-ops)', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    const d = expectAllow(resolvePermission(PAIR_PRINCIPAL, CMD, { amount: '700', fee: '50' }));
    d.commit();
    d.commit();
    d.commit();
    expect(mockRecordSpend).toHaveBeenCalledTimes(1);
  });

  it('does not debit before commit is called', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    expectAllow(resolvePermission(PAIR_PRINCIPAL, CMD, { amount: '700', fee: '50' }));
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('two independent allow decisions yield independent commits', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    const a = expectAllow(resolvePermission(PAIR_PRINCIPAL, CMD, { amount: '100' }));
    const b = expectAllow(resolvePermission(PAIR_PRINCIPAL, CMD, { amount: '200' }));
    b.commit(); // only commit b
    expect(mockRecordSpend).toHaveBeenCalledTimes(1);
    expect(mockRecordSpend.mock.calls[0][1].toFixed(0)).toBe('200');
    a.commit();
    expect(mockRecordSpend).toHaveBeenCalledTimes(2);
    expect(mockRecordSpend.mock.calls[1][1].toFixed(0)).toBe('100');
  });

  it('allows when amount + fee equals cap exactly', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, { amount: '700', fee: '300' }).kind).toBe('allow');
  });

  it('prompts when amount + fee exceeds cap', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, { amount: '700', fee: '301' })).toMatchObject({
      kind: 'prompt',
      reason: 'budget exhausted',
    });
  });

  it('respects already-spent mojos against the cap', () => {
    mockGetPair.mockReturnValue(
      makePair({ spendingMode: 'auto', spendingCapMojos: '1000', spentMojos: '900' }),
    );
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, { amount: '50', fee: '50' }).kind).toBe('allow');
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, { amount: '101' })).toMatchObject({
      kind: 'prompt',
      reason: 'budget exhausted',
    });
  });

  it.each([
    ['unparseable', { amount: 'not-a-number' }],
    ['negative', { amount: '-5' }],
    ['missing', {}],
  ])('prompts when amount is %s under auto mode', (_label, payload) => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, payload)).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('handles values beyond JS safe-integer range', () => {
    const cap = '100000000000000000000';
    const amount = '99999999999999999999';
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: cap }));
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, { amount }).kind).toBe('allow');
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, { amount, fee: '2' })).toMatchObject({
      kind: 'prompt',
      reason: 'budget exhausted',
    });
  });
});

describe('resolvePermission - create_offer_for_ids (offer with XCH outflow)', () => {
  const CMD = 'chia_wallet.create_offer_for_ids';

  it('allows and debits XCH outflow + fee on commit', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '5000' }));
    const d = expectAllow(
      resolvePermission(PAIR_PRINCIPAL, CMD, { offer: { 1: '1000', xch: '500' }, fee: '25' }),
    );
    d.commit();
    expect(mockRecordSpend.mock.calls[0][1].toFixed(0)).toBe('1525');
  });

  it('prompts when XCH outflow + fee exceed cap', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    expect(
      resolvePermission(PAIR_PRINCIPAL, CMD, { offer: { 1: '900' }, fee: '200' }),
    ).toMatchObject({ kind: 'prompt', reason: 'budget exhausted' });
  });

  it('skips offer lines with non-positive amounts', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '100' }));
    expect(
      resolvePermission(PAIR_PRINCIPAL, CMD, {
        offer: { 1: '50', xch: '-1000' },
        fee: '0',
      }).kind,
    ).toBe('allow');
  });

  it('prompts when offer touches a non-XCH key (cannot price against XCH cap)', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '99999' }));
    expect(
      resolvePermission(PAIR_PRINCIPAL, CMD, { offer: { '8d3ed4c4...': '100' }, fee: '0' }),
    ).toMatchObject({ kind: 'prompt', reason: 'spending needs confirmation' });
  });

  it.each([
    ['missing offer', {}],
    ['non-object offer', { offer: 'oops' }],
  ])('prompts when offer payload is %s', (_label, payload) => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '99999' }));
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, payload)).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('denies under block mode', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'block' }));
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, { offer: { 1: '100' } })).toEqual({
      kind: 'deny',
      reason: 'spending blocked for this app',
    });
  });

  it('prompts under ask mode without consulting the cap', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'ask', spendingCapMojos: '0' }));
    expect(resolvePermission(PAIR_PRINCIPAL, CMD, { offer: { 1: '100' } })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });
});

describe('toWire', () => {
  it('strips commit from allow', () => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { innocuous: true } }));
    const decision = resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallets', {});
    const wire = toWire(decision);
    expect(wire).toEqual({ kind: 'allow' });
    expect((wire as Record<string, unknown>).commit).toBeUndefined();
  });

  it('preserves prompt reason and pair', () => {
    mockGetPair.mockReturnValue(makePair({ metadata: { name: 'X', url: 'https://x' } }));
    const decision = resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.send_transaction', {});
    expect(toWire(decision)).toEqual({
      kind: 'prompt',
      reason: 'spending needs confirmation',
      pair: { topic: TOPIC, name: 'X', url: 'https://x' },
    });
  });

  it('preserves deny reason', () => {
    mockGetPair.mockReturnValue(undefined);
    const decision = resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.send_transaction', {});
    expect(toWire(decision)).toEqual({ kind: 'deny', reason: 'unknown pair' });
  });

  it('roundtrip survives JSON (no functions on the wire)', () => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { innocuous: true } }));
    const wire = toWire(resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallets', {}));
    expect(JSON.parse(JSON.stringify(wire))).toEqual(wire);
  });
});

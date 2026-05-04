import BigNumber from 'bignumber.js';

import { resolvePermission } from './permissions';
import { getPair, recordSpend } from './pairStore';
import type { Decision, PairRecord, SpendingMode } from './types';

jest.mock('./pairStore', () => ({
  getPair: jest.fn(),
  recordSpend: jest.fn(),
}));

const mockGetPair = getPair as jest.MockedFunction<typeof getPair>;
const mockRecordSpend = recordSpend as jest.MockedFunction<typeof recordSpend>;

const TOPIC = 'topic-1';
const PAIR_PRINCIPAL = { kind: 'pair' as const, topic: TOPIC };
const UI_PRINCIPAL = { kind: 'ui' as const };

// Wide default so tests focus on the bypass/spend logic, not the per-pair
// allowlist gate. The `commands` gate has its own dedicated suite below;
// tests in this file that exercise other code paths assume the command is
// in the list. All entries use wire form (`chia_<name>`).
const DEFAULT_COMMANDS: readonly string[] = [
  'chia_getWallets',
  'chia_getWalletBalance',
  'chia_getWalletBalances',
  'chia_sendTransaction',
  'chia_spendCAT',
  'chia_transferNFT',
  'chia_takeOffer',
  'chia_cancelOffer',
  'chia_createOfferForIds',
  'chia_signMessageByAddress',
  'chia_signMessageById',
  'chia_pushTransactions',
  'chia_getCoinRecordsByNames',
];

// Namespaced daemon command → WC name (wire form).
const NS_TO_WC: Record<string, string> = {
  'chia_wallet.get_wallets': 'chia_getWallets',
  'chia_wallet.get_wallet_balance': 'chia_getWalletBalance',
  'chia_wallet.get_wallet_balances': 'chia_getWalletBalances',
  'chia_wallet.send_transaction': 'chia_sendTransaction',
  'chia_wallet.cat_spend': 'chia_spendCAT',
  'chia_wallet.nft_transfer_nft': 'chia_transferNFT',
  'chia_wallet.take_offer': 'chia_takeOffer',
  'chia_wallet.cancel_offer': 'chia_cancelOffer',
  'chia_wallet.create_offer_for_ids': 'chia_createOfferForIds',
  'chia_wallet.sign_message_by_address': 'chia_signMessageByAddress',
  'chia_wallet.sign_message_by_id': 'chia_signMessageById',
  'chia_wallet.push_transactions': 'chia_pushTransactions',
  'chia_wallet.get_coin_records_by_names': 'chia_getCoinRecordsByNames',
};

function makePair(
  overrides: {
    spendingMode?: SpendingMode;
    spendingCapMojos?: string;
    spentMojos?: string;
    metadata?: Partial<PairRecord['metadata']>;
    commands?: string[];
    bypass?: string[];
  } = {},
): PairRecord {
  return {
    topic: TOPIC,
    mainnet: true,
    metadata: { name: 'Test Dapp', ...overrides.metadata },
    fingerprints: [123],
    createdAt: 0,
    updatedAt: 0,
    spentMojos: overrides.spentMojos ?? '0',
    commands: overrides.commands ?? [...DEFAULT_COMMANDS],
    bypass: overrides.bypass ?? [],
    grants: {
      spendingMode: overrides.spendingMode ?? 'ask',
      spendingCapMojos: overrides.spendingCapMojos ?? '0',
    },
  };
}

function pairResolve(nsCommand: string, payload: Record<string, unknown> = {}): Decision {
  return resolvePermission(PAIR_PRINCIPAL, nsCommand, payload, {
    wcCommand: NS_TO_WC[nsCommand] ?? 'chia_unknown',
  });
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
    expect(pairResolve('chia_wallet.get_wallets', {})).toEqual({
      kind: 'deny',
      reason: 'unknown pair',
    });
  });

  it('denies even for sensitive commands', () => {
    mockGetPair.mockReturnValue(undefined);
    expect(pairResolve('chia_wallet.delete_key', {})).toEqual({
      kind: 'deny',
      reason: 'unknown pair',
    });
  });
});

describe('resolvePermission - pair context shape', () => {
  it('attaches dialog-shaped pair info to prompt decisions, never the raw record', () => {
    const pair = makePair({ metadata: { name: 'My Dapp', url: 'https://app.example' } });
    mockGetPair.mockReturnValue(pair);
    const d = pairResolve('chia_wallet.get_wallets', {});
    expect(d).toEqual({
      kind: 'prompt',
      reason: 'not in bypass list',
      pair: { topic: TOPIC, name: 'My Dapp', url: 'https://app.example' },
    });
  });

  it('omits pair on UI prompts', () => {
    const d = resolvePermission(UI_PRINCIPAL, 'chia_wallet.send_transaction', {});
    expect(d).toEqual({ kind: 'prompt', reason: 'requires user confirmation', pair: undefined });
  });

  it('omits pair on deny ("unknown pair")', () => {
    mockGetPair.mockReturnValue(undefined);
    expect(pairResolve('chia_wallet.send_transaction', {})).toEqual({
      kind: 'deny',
      reason: 'unknown pair',
    });
  });
});

describe('resolvePermission - bypass-driven allow', () => {
  // The merged model: a command is silently allowed iff it appears in
  // pair.bypass. No more capability buckets at the runtime layer — those
  // were just UI groupings for bulk-toggling individual entries.
  it('allows a balance command when its wcCommand is in bypass', () => {
    mockGetPair.mockReturnValue(makePair({ bypass: ['chia_getWalletBalance', 'chia_getWalletBalances'] }));
    expect(pairResolve('chia_wallet.get_wallet_balance', {}).kind).toBe('allow');
    expect(pairResolve('chia_wallet.get_wallet_balances', {}).kind).toBe('allow');
  });

  it('allows an innocuous command when its wcCommand is in bypass', () => {
    mockGetPair.mockReturnValue(makePair({ bypass: ['chia_getWallets', 'chia_getCoinRecordsByNames'] }));
    expect(pairResolve('chia_wallet.get_wallets', {}).kind).toBe('allow');
    expect(pairResolve('chia_wallet.get_coin_records_by_names', {}).kind).toBe('allow');
  });

  it('allows a sign command when its wcCommand is in bypass', () => {
    mockGetPair.mockReturnValue(makePair({ bypass: ['chia_signMessageByAddress', 'chia_signMessageById'] }));
    expect(pairResolve('chia_wallet.sign_message_by_address', {}).kind).toBe('allow');
    expect(pairResolve('chia_wallet.sign_message_by_id', {}).kind).toBe('allow');
  });

  it('prompts with "not in bypass list" when wcCommand absent', () => {
    mockGetPair.mockReturnValue(makePair({ bypass: [] }));
    const d = pairResolve('chia_wallet.get_wallet_balance', {});
    expect(d.kind).toBe('prompt');
    expect((d as Extract<Decision, { kind: 'prompt' }>).reason).toBe('not in bypass list');
  });

  it('only-this-command-bypassed grants exactly that command, not its siblings', () => {
    // The whole point of moving to a per-command list: if a future release
    // adds a new balance command, an existing pair with only the OLD
    // command bypassed does not silently auto-bypass the new one.
    mockGetPair.mockReturnValue(makePair({ bypass: ['chia_getWalletBalance'] }));
    expect(pairResolve('chia_wallet.get_wallet_balance', {}).kind).toBe('allow');
    expect(pairResolve('chia_wallet.get_wallet_balances', {})).toMatchObject({
      kind: 'prompt',
      reason: 'not in bypass list',
    });
  });

  it('bypass allow has no-op commit (read-only commands)', () => {
    mockGetPair.mockReturnValue(makePair({ bypass: ['chia_getWalletBalance'] }));
    const d = expectAllow(pairResolve('chia_wallet.get_wallet_balance', {}));
    d.commit();
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });
});

describe('resolvePermission - push_transactions', () => {
  const CMD = 'chia_wallet.push_transactions';
  const WC = 'chia_pushTransactions';

  it.each([
    ['true', true],
    ['string "true"', 'true'],
    ['string "false"', 'false'],
    ['number 1', 1],
    ['object {}', {}],
  ])('prompts with "signing requested" when sign is truthy via %s (Python truthiness)', (_label, sign) => {
    mockGetPair.mockReturnValue(makePair({ bypass: [WC] }));
    expect(pairResolve(CMD, { sign })).toMatchObject({
      kind: 'prompt',
      reason: 'signing requested',
    });
  });

  it('prompts when push is not in bypass', () => {
    mockGetPair.mockReturnValue(makePair({ bypass: [] }));
    expect(pairResolve(CMD, {})).toMatchObject({
      kind: 'prompt',
      reason: 'not in bypass list',
    });
  });

  it.each([
    ['omitted', undefined],
    ['false', false],
    ['number 0', 0],
    ['null', null],
  ])('allows when sign is falsy via %s and push is in bypass', (_label, sign) => {
    mockGetPair.mockReturnValue(makePair({ bypass: [WC] }));
    const payload = sign === undefined ? {} : { sign };
    expect(pairResolve(CMD, payload).kind).toBe('allow');
  });

  it('allows when fee fits in remaining budget and debits only the fee on commit', () => {
    mockGetPair.mockReturnValue(
      makePair({ bypass: [WC], spendingCapMojos: '1000', spentMojos: '200' }),
    );
    const d = expectAllow(pairResolve(CMD, { fee: '500' }));
    d.commit();
    expect(mockRecordSpend).toHaveBeenCalledTimes(1);
    const [topic, mojos] = mockRecordSpend.mock.calls[0];
    expect(topic).toBe(TOPIC);
    expect(mojos.toFixed(0)).toBe('500');
  });

  it('allows when spent + fee equals cap exactly', () => {
    mockGetPair.mockReturnValue(makePair({ bypass: [WC], spendingCapMojos: '1000', spentMojos: '400' }));
    expect(pairResolve(CMD, { fee: '600' }).kind).toBe('allow');
  });

  it('prompts when fee exceeds remaining budget', () => {
    mockGetPair.mockReturnValue(makePair({ bypass: [WC], spendingCapMojos: '1000', spentMojos: '900' }));
    expect(pairResolve(CMD, { fee: '200' })).toMatchObject({
      kind: 'prompt',
      reason: 'push fee exceeds remaining budget',
    });
  });

  it('treats negative fee as zero (cannot reduce spend)', () => {
    mockGetPair.mockReturnValue(makePair({ bypass: [WC], spendingCapMojos: '0', spentMojos: '0' }));
    const d = expectAllow(pairResolve(CMD, { fee: '-100' }));
    d.commit();
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('does not record on commit when fee is zero or missing', () => {
    mockGetPair.mockReturnValue(makePair({ bypass: [WC] }));
    expectAllow(pairResolve(CMD, {})).commit();
    expectAllow(pairResolve(CMD, { fee: '0' })).commit();
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('preserves precision beyond JS safe-integer range', () => {
    const cap = '99999999999999999999';
    const fee = '99999999999999999999';
    mockGetPair.mockReturnValue(makePair({ bypass: [WC], spendingCapMojos: cap, spentMojos: '0' }));
    const d = expectAllow(pairResolve(CMD, { fee }));
    d.commit();
    const [, mojos] = mockRecordSpend.mock.calls[0];
    expect(mojos.toFixed(0)).toBe(fee);
    expect(mojos).toBeInstanceOf(BigNumber);
  });
});

describe('resolvePermission - spend-class commands (governed by spendingMode)', () => {
  // Spend-class commands are NOT bypassable — the budget is the right knob.
  // Even with the wcCommand in bypass, spending logic still fires.
  const SEND = 'chia_wallet.send_transaction';
  const SEND_WC = 'chia_sendTransaction';
  const OFFER = 'chia_wallet.create_offer_for_ids';

  it('block mode denies spend regardless of bypass', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'block', bypass: [SEND_WC] }));
    expect(pairResolve(SEND, { amount: '100', fee: '0' })).toEqual({
      kind: 'deny',
      reason: 'spending blocked for this app',
    });
  });

  it('ask mode prompts for spend regardless of bypass', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'ask', bypass: [SEND_WC] }));
    expect(pairResolve(SEND, { amount: '100', fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('auto allows when amount + fee fit in remaining budget', () => {
    mockGetPair.mockReturnValue(
      makePair({ spendingMode: 'auto', spendingCapMojos: '1000', spentMojos: '200' }),
    );
    const d = expectAllow(pairResolve(SEND, { amount: '500', fee: '100' }));
    d.commit();
    const [, mojos] = mockRecordSpend.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('600');
  });

  it('auto prompts when amount + fee exceed remaining budget', () => {
    mockGetPair.mockReturnValue(
      makePair({ spendingMode: 'auto', spendingCapMojos: '1000', spentMojos: '900' }),
    );
    expect(pairResolve(SEND, { amount: '500', fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'budget exhausted',
    });
  });

  it('auto without resolvable amount prompts (CAT spend, NFT, mixed offer)', () => {
    mockGetPair.mockReturnValue(
      makePair({ spendingMode: 'auto', spendingCapMojos: '1_000_000_000_000' }),
    );
    // create_offer_for_ids without a pure-XCH offer dict yields an
    // unresolvable amount — fall back to prompt.
    expect(pairResolve(OFFER, { offer: { '0xcat': '100' }, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('create_offer_for_ids with pure-XCH offer + auto allows when fits in budget', () => {
    mockGetPair.mockReturnValue(
      makePair({ spendingMode: 'auto', spendingCapMojos: '10000', spentMojos: '0' }),
    );
    const d = expectAllow(pairResolve(OFFER, { offer: { xch: '5000' }, fee: '0' }));
    d.commit();
    const [, mojos] = mockRecordSpend.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('5000');
  });
});

describe('resolvePermission - commands gate (pair.commands allowlist)', () => {
  const SEND_WC = 'chia_sendTransaction';

  it('denies a command not in pair.commands even if everything else lines up', () => {
    mockGetPair.mockReturnValue(makePair({ commands: [], bypass: [SEND_WC], spendingMode: 'auto' }));
    expect(pairResolve('chia_wallet.send_transaction', {})).toEqual({
      kind: 'deny',
      reason: `command not granted for this pair: ${SEND_WC}`,
    });
  });

  it('denies when wcCommand is missing from the resolve context', () => {
    mockGetPair.mockReturnValue(makePair({ bypass: ['chia_getWallets'] }));
    expect(
      resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallets', {}, {}),
    ).toEqual({ kind: 'deny', reason: 'missing wc command' });
  });
});

describe('resolvePermission - commit idempotency', () => {
  // Captures the resolved spend amount at decision time so a runtime mutation
  // of the payload between resolve and authorization can't change what gets
  // debited. Idempotent commits prevent double-charge.
  it('commit is no-op on second call', () => {
    mockGetPair.mockReturnValue(
      makePair({ spendingMode: 'auto', spendingCapMojos: '10000', spentMojos: '0' }),
    );
    const d = expectAllow(pairResolve('chia_wallet.send_transaction', { amount: '500' }));
    d.commit();
    d.commit();
    expect(mockRecordSpend).toHaveBeenCalledTimes(1);
  });

  it('separate resolve calls produce independent commits', () => {
    mockGetPair.mockReturnValue(
      makePair({ spendingMode: 'auto', spendingCapMojos: '10000', spentMojos: '0' }),
    );
    const d1 = expectAllow(pairResolve('chia_wallet.send_transaction', { amount: '500' }));
    const d2 = expectAllow(pairResolve('chia_wallet.send_transaction', { amount: '300' }));
    d1.commit();
    d2.commit();
    expect(mockRecordSpend).toHaveBeenCalledTimes(2);
  });
});

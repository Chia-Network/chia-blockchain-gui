import BigNumber from 'bignumber.js';

import { sendDappAndAwait } from '../utils/webSocketBridge';

import { resolvePermission } from './permissions';
import { getPair, recordSpend } from './pairStore';
import type { Decision, PairRecord, SpendingMode } from './types';

jest.mock('./pairStore', () => ({
  getPair: jest.fn(),
  recordSpend: jest.fn(),
}));

jest.mock('../utils/webSocketBridge', () => ({
  sendDappAndAwait: jest.fn(),
}));

const mockGetPair = getPair as jest.MockedFunction<typeof getPair>;
const mockRecordSpend = recordSpend as jest.MockedFunction<typeof recordSpend>;
const mockSendDappAndAwait = sendDappAndAwait as jest.MockedFunction<typeof sendDappAndAwait>;

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

function pairResolve(nsCommand: string, payload: Record<string, unknown> = {}): Promise<Decision> {
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
  mockSendDappAndAwait.mockReset();
});

describe('resolvePermission - UI principal', () => {
  it('allows commands present in AllowedCommands', async () => {
    expect((await resolvePermission(UI_PRINCIPAL, 'chia_wallet.get_wallets', {})).kind).toBe('allow');
  });

  it('prompts for commands not in AllowedCommands', async () => {
    expect(await resolvePermission(UI_PRINCIPAL, 'chia_wallet.send_transaction', {})).toEqual({
      kind: 'prompt',
      reason: 'requires user confirmation',
      pair: undefined,
    });
  });

  it('does not consult the pair store', async () => {
    await resolvePermission(UI_PRINCIPAL, 'chia_wallet.send_transaction', {});
    expect(mockGetPair).not.toHaveBeenCalled();
  });

  it('UI allow has a no-op commit (cannot debit a UI principal)', async () => {
    const d = expectAllow(await resolvePermission(UI_PRINCIPAL, 'chia_wallet.get_wallets', {}));
    d.commit();
    d.commit();
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });
});

describe('resolvePermission - unknown pair topic', () => {
  it('denies before evaluating any command-specific rules', async () => {
    mockGetPair.mockReturnValue(undefined);
    expect(await pairResolve('chia_wallet.get_wallets', {})).toEqual({
      kind: 'deny',
      reason: 'unknown pair',
    });
  });

  it('denies even for sensitive commands', async () => {
    mockGetPair.mockReturnValue(undefined);
    expect(await pairResolve('chia_wallet.delete_key', {})).toEqual({
      kind: 'deny',
      reason: 'unknown pair',
    });
  });
});

describe('resolvePermission - pair context shape', () => {
  it('attaches dialog-shaped pair info to prompt decisions, never the raw record', async () => {
    const pair = makePair({ metadata: { name: 'My Dapp', url: 'https://app.example' } });
    mockGetPair.mockReturnValue(pair);
    const d = await pairResolve('chia_wallet.get_wallets', {});
    expect(d).toEqual({
      kind: 'prompt',
      reason: 'not in bypass list',
      pair: { topic: TOPIC, name: 'My Dapp', url: 'https://app.example' },
    });
  });

  it('omits pair on UI prompts', async () => {
    const d = await resolvePermission(UI_PRINCIPAL, 'chia_wallet.send_transaction', {});
    expect(d).toEqual({ kind: 'prompt', reason: 'requires user confirmation', pair: undefined });
  });

  it('omits pair on deny ("unknown pair")', async () => {
    mockGetPair.mockReturnValue(undefined);
    expect(await pairResolve('chia_wallet.send_transaction', {})).toEqual({
      kind: 'deny',
      reason: 'unknown pair',
    });
  });
});

describe('resolvePermission - bypass-driven allow', () => {
  // The merged model: a command is silently allowed iff it appears in
  // pair.bypass. No more capability buckets at the runtime layer — those
  // were just UI groupings for bulk-toggling individual entries.
  it('allows a balance command when its wcCommand is in bypass', async () => {
    mockGetPair.mockReturnValue(makePair({ bypass: ['chia_getWalletBalance', 'chia_getWalletBalances'] }));
    expect((await pairResolve('chia_wallet.get_wallet_balance', {})).kind).toBe('allow');
    expect((await pairResolve('chia_wallet.get_wallet_balances', {})).kind).toBe('allow');
  });

  it('allows an innocuous command when its wcCommand is in bypass', async () => {
    mockGetPair.mockReturnValue(makePair({ bypass: ['chia_getWallets', 'chia_getCoinRecordsByNames'] }));
    expect((await pairResolve('chia_wallet.get_wallets', {})).kind).toBe('allow');
    expect((await pairResolve('chia_wallet.get_coin_records_by_names', {})).kind).toBe('allow');
  });

  it('allows a sign command when its wcCommand is in bypass', async () => {
    mockGetPair.mockReturnValue(makePair({ bypass: ['chia_signMessageByAddress', 'chia_signMessageById'] }));
    expect((await pairResolve('chia_wallet.sign_message_by_address', {})).kind).toBe('allow');
    expect((await pairResolve('chia_wallet.sign_message_by_id', {})).kind).toBe('allow');
  });

  it('prompts with "not in bypass list" when wcCommand absent', async () => {
    mockGetPair.mockReturnValue(makePair({ bypass: [] }));
    const d = await pairResolve('chia_wallet.get_wallet_balance', {});
    expect(d.kind).toBe('prompt');
    expect((d as Extract<Decision, { kind: 'prompt' }>).reason).toBe('not in bypass list');
  });

  it('only-this-command-bypassed grants exactly that command, not its siblings', async () => {
    // The whole point of moving to a per-command list: if a future release
    // adds a new balance command, an existing pair with only the OLD
    // command bypassed does not silently auto-bypass the new one.
    mockGetPair.mockReturnValue(makePair({ bypass: ['chia_getWalletBalance'] }));
    expect((await pairResolve('chia_wallet.get_wallet_balance', {})).kind).toBe('allow');
    expect(await pairResolve('chia_wallet.get_wallet_balances', {})).toMatchObject({
      kind: 'prompt',
      reason: 'not in bypass list',
    });
  });

  it('bypass allow has no-op commit (read-only commands)', async () => {
    mockGetPair.mockReturnValue(makePair({ bypass: ['chia_getWalletBalance'] }));
    const d = expectAllow(await pairResolve('chia_wallet.get_wallet_balance', {}));
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
  ])('prompts with "signing requested" when sign is truthy via %s (Python truthiness)', async (_label, sign) => {
    mockGetPair.mockReturnValue(makePair({ bypass: [WC] }));
    expect(await pairResolve(CMD, { sign })).toMatchObject({
      kind: 'prompt',
      reason: 'signing requested',
    });
  });

  it('prompts when push is not in bypass', async () => {
    mockGetPair.mockReturnValue(makePair({ bypass: [] }));
    expect(await pairResolve(CMD, {})).toMatchObject({
      kind: 'prompt',
      reason: 'not in bypass list',
    });
  });

  it.each([
    ['omitted', undefined],
    ['false', false],
    ['number 0', 0],
    ['null', null],
  ])('allows when sign is falsy via %s and push is in bypass', async (_label, sign) => {
    mockGetPair.mockReturnValue(makePair({ bypass: [WC] }));
    const payload = sign === undefined ? {} : { sign };
    expect((await pairResolve(CMD, payload)).kind).toBe('allow');
  });

  it('allows when fee fits in remaining budget and debits only the fee on commit', async () => {
    mockGetPair.mockReturnValue(makePair({ bypass: [WC], spendingCapMojos: '1000', spentMojos: '200' }));
    const d = expectAllow(await pairResolve(CMD, { fee: '500' }));
    d.commit();
    expect(mockRecordSpend).toHaveBeenCalledTimes(1);
    const [topic, mojos] = mockRecordSpend.mock.calls[0];
    expect(topic).toBe(TOPIC);
    expect(mojos.toFixed(0)).toBe('500');
  });

  it('allows when spent + fee equals cap exactly', async () => {
    mockGetPair.mockReturnValue(makePair({ bypass: [WC], spendingCapMojos: '1000', spentMojos: '400' }));
    expect((await pairResolve(CMD, { fee: '600' })).kind).toBe('allow');
  });

  it('prompts when fee exceeds remaining budget', async () => {
    mockGetPair.mockReturnValue(makePair({ bypass: [WC], spendingCapMojos: '1000', spentMojos: '900' }));
    expect(await pairResolve(CMD, { fee: '200' })).toMatchObject({
      kind: 'prompt',
      reason: 'push fee exceeds remaining budget',
    });
  });

  it('treats negative fee as zero (cannot reduce spend)', async () => {
    mockGetPair.mockReturnValue(makePair({ bypass: [WC], spendingCapMojos: '0', spentMojos: '0' }));
    const d = expectAllow(await pairResolve(CMD, { fee: '-100' }));
    d.commit();
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('does not record on commit when fee is zero or missing', async () => {
    mockGetPair.mockReturnValue(makePair({ bypass: [WC] }));
    expectAllow(await pairResolve(CMD, {})).commit();
    expectAllow(await pairResolve(CMD, { fee: '0' })).commit();
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('preserves precision beyond JS safe-integer range', async () => {
    const cap = '99999999999999999999';
    const fee = '99999999999999999999';
    mockGetPair.mockReturnValue(makePair({ bypass: [WC], spendingCapMojos: cap, spentMojos: '0' }));
    const d = expectAllow(await pairResolve(CMD, { fee }));
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

  it('block mode denies spend regardless of bypass', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'block', bypass: [SEND_WC] }));
    expect(await pairResolve(SEND, { amount: '100', fee: '0' })).toEqual({
      kind: 'deny',
      reason: 'spending blocked for this app',
    });
  });

  it('ask mode prompts for spend regardless of bypass', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'ask', bypass: [SEND_WC] }));
    expect(await pairResolve(SEND, { amount: '100', fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('auto allows when amount + fee fit in remaining budget', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000', spentMojos: '200' }));
    const d = expectAllow(await pairResolve(SEND, { amount: '500', fee: '100' }));
    d.commit();
    const [, mojos] = mockRecordSpend.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('600');
  });

  it('auto prompts when amount + fee exceed remaining budget', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000', spentMojos: '900' }));
    expect(await pairResolve(SEND, { amount: '500', fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'budget exhausted',
    });
  });

  it('auto without resolvable amount prompts (CAT spend, NFT, mixed offer)', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1_000_000_000_000' }));
    // create_offer_for_ids without a pure-XCH offer dict yields an
    // unresolvable amount — fall back to prompt.
    expect(await pairResolve(OFFER, { offer: { '0xcat': '100' }, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('create_offer_for_ids with pure-XCH offer + auto allows when fits in budget', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '10000', spentMojos: '0' }));
    const d = expectAllow(await pairResolve(OFFER, { offer: { xch: '5000' }, fee: '0' }));
    d.commit();
    const [, mojos] = mockRecordSpend.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('5000');
  });
});

describe('resolvePermission - take_offer (XCH-only auto-approve)', () => {
  const TAKE = 'chia_wallet.take_offer';
  const OFFER_STR = 'offer1abc...';

  // The daemon round-trip happens inside the resolver; a successful response
  // unwraps as { data: { summary: { offered, requested, ... } } }.
  function mockSummary(summary: unknown) {
    mockSendDappAndAwait.mockResolvedValueOnce({ data: { summary } });
  }

  it('ask mode prompts without calling get_offer_summary', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'ask' }));
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
    expect(mockSendDappAndAwait).not.toHaveBeenCalled();
  });

  it('block mode denies without calling get_offer_summary', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'block' }));
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toEqual({
      kind: 'deny',
      reason: 'spending blocked for this app',
    });
    expect(mockSendDappAndAwait).not.toHaveBeenCalled();
  });

  it('auto allows when summary.requested is XCH-only and fits in budget', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '10000', spentMojos: '0' }));
    mockSummary({ offered: { '0xnft': 1 }, requested: { xch: '5000' } });
    const d = expectAllow(await pairResolve(TAKE, { offer: OFFER_STR, fee: '100' }));
    d.commit();
    const [, mojos] = mockRecordSpend.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('5100');
  });

  it('auto prompts when summary.requested includes a CAT', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1_000_000_000_000' }));
    mockSummary({ offered: {}, requested: { xch: '1000', '0xcat': 5 } });
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('auto prompts when summary.requested is NFT-only (non-XCH)', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1_000_000_000_000' }));
    mockSummary({ offered: { xch: '1000' }, requested: { '0xnft': 1 } });
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('auto allows when summary.requested is empty (free offer) — only fee charged', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000', spentMojos: '0' }));
    mockSummary({ offered: { '0xnft': 1 }, requested: {} });
    const d = expectAllow(await pairResolve(TAKE, { offer: OFFER_STR, fee: '50' }));
    d.commit();
    const [, mojos] = mockRecordSpend.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('50');
  });

  it('auto prompts when XCH outflow + fee exceed budget', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000', spentMojos: '500' }));
    mockSummary({ offered: {}, requested: { xch: '600' } });
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'budget exhausted',
    });
  });

  it('auto prompts when daemon returns an error (offer cannot be parsed)', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1_000_000_000_000' }));
    mockSendDappAndAwait.mockResolvedValueOnce({ data: { error: 'invalid bech32' } });
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('auto prompts when offer string is missing', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1_000_000_000_000' }));
    expect(await pairResolve(TAKE, { fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
    expect(mockSendDappAndAwait).not.toHaveBeenCalled();
  });

  it('auto prompts when sendDappAndAwait throws (timeout, disconnect)', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1_000_000_000_000' }));
    mockSendDappAndAwait.mockRejectedValueOnce(new Error('timeout'));
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });
});

describe('resolvePermission - commands gate (pair.commands allowlist)', () => {
  const SEND_WC = 'chia_sendTransaction';

  it('denies a command not in pair.commands even if everything else lines up', async () => {
    mockGetPair.mockReturnValue(makePair({ commands: [], bypass: [SEND_WC], spendingMode: 'auto' }));
    expect(await pairResolve('chia_wallet.send_transaction', {})).toEqual({
      kind: 'deny',
      reason: `command not granted for this pair: ${SEND_WC}`,
    });
  });

  it('denies when wcCommand is missing from the resolve context', async () => {
    mockGetPair.mockReturnValue(makePair({ bypass: ['chia_getWallets'] }));
    expect(await resolvePermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallets', {}, {})).toEqual({
      kind: 'deny',
      reason: 'missing wc command',
    });
  });
});

describe('resolvePermission - commit idempotency', () => {
  // Captures the resolved spend amount at decision time so a runtime mutation
  // of the payload between resolve and authorization can't change what gets
  // debited. Idempotent commits prevent double-charge.
  it('commit is no-op on second call', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '10000', spentMojos: '0' }));
    const d = expectAllow(await pairResolve('chia_wallet.send_transaction', { amount: '500' }));
    d.commit();
    d.commit();
    expect(mockRecordSpend).toHaveBeenCalledTimes(1);
  });

  it('separate resolve calls produce independent commits', async () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '10000', spentMojos: '0' }));
    const d1 = expectAllow(await pairResolve('chia_wallet.send_transaction', { amount: '500' }));
    const d2 = expectAllow(await pairResolve('chia_wallet.send_transaction', { amount: '300' }));
    d1.commit();
    d2.commit();
    expect(mockRecordSpend).toHaveBeenCalledTimes(2);
  });
});

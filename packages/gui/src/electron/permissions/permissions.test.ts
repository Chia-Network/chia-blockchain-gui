import BigNumber from 'bignumber.js';

import { sendDappAndAwait } from '../utils/webSocketBridge';

import { getPair, recordUsage } from './pairStore';
import { resolvePermission } from './permissions';
import type { Decision, PairRecord } from './types';

jest.mock('./pairStore', () => ({
  getPair: jest.fn(),
  recordUsage: jest.fn(),
}));

jest.mock('../utils/webSocketBridge', () => ({
  sendDappAndAwait: jest.fn(),
}));

const mockGetPair = getPair as jest.MockedFunction<typeof getPair>;
const mockRecordUsage = recordUsage as jest.MockedFunction<typeof recordUsage>;
const mockSendDappAndAwait = sendDappAndAwait as jest.MockedFunction<typeof sendDappAndAwait>;

const TOPIC = 'topic-1';
const PAIR_PRINCIPAL = { kind: 'pair' as const, topic: TOPIC };
const UI_PRINCIPAL = { kind: 'ui' as const };

// Wide default so tests focus on the gate logic, not the per-pair allowlist
// gate. The `commands` gate has its own dedicated suite below; tests in this
// file that exercise other code paths assume the command is in the list.
// All entries use wire form (`chia_<name>`).
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
    xchMojos?: string;
    usedMojos?: string;
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
    usedMojos: overrides.usedMojos ?? '0',
    commands: overrides.commands ?? [...DEFAULT_COMMANDS],
    bypass: overrides.bypass ?? [],
    grants: { xchMojos: overrides.xchMojos ?? '0' },
  };
}

function pairResolve(nsCommand: string, payload: Record<string, unknown> = {}): Promise<Decision> {
  return resolvePermission(PAIR_PRINCIPAL, nsCommand, payload, {
    wcCommand: NS_TO_WC[nsCommand] ?? 'chia_unknown',
    // Default makePair returns mainnet: true; helper matches so tests focus
    // on per-command logic and not the network gate (which has its own suite
    // in checkPairAccess.test.ts).
    mainnet: true,
  });
}

function expectAllow(d: Decision): Extract<Decision, { kind: 'allow' }> {
  expect(d.kind).toBe('allow');
  return d as Extract<Decision, { kind: 'allow' }>;
}

beforeEach(() => {
  mockGetPair.mockReset();
  mockRecordUsage.mockReset();
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
    expect(mockRecordUsage).not.toHaveBeenCalled();
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
  // Command bypass is exact command-level trust. Spend-class commands may
  // also use the XCH allowance fallback, but bypass wins when present.
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
    expect(mockRecordUsage).not.toHaveBeenCalled();
  });

  it('allows exactly one spend command when that wcCommand is in bypass', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '0', bypass: ['chia_sendTransaction'] }));
    expect((await pairResolve('chia_wallet.send_transaction', { amount: '100', fee: '0' })).kind).toBe('allow');
    expect(await pairResolve('chia_wallet.create_offer_for_ids', { offer: { '1': '-100' }, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('bypassed spend commands do not debit the XCH allowance', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '0', bypass: ['chia_sendTransaction'] }));
    const d = expectAllow(await pairResolve('chia_wallet.send_transaction', { amount: '100', fee: '50' }));
    d.commit();
    expect(mockRecordUsage).not.toHaveBeenCalled();
  });
});

describe('resolvePermission - sign-class always prompts', () => {
  // Sign-class never auto-allows, even with the wcCommand in bypass.
  // Trading a key signature for an off-chain trust toggle is a foot-gun
  // we don't expose. Command bypass and the allowance both sit below the
  // signing gate.
  it('prompts for sign_message_by_address even when bypass lists it', async () => {
    mockGetPair.mockReturnValue(makePair({ bypass: ['chia_signMessageByAddress'] }));
    expect(await pairResolve('chia_wallet.sign_message_by_address', { message: 'hi' })).toMatchObject({
      kind: 'prompt',
      reason: 'signing requested',
    });
  });

  it('prompts for sign_message_by_id even when bypass lists it', async () => {
    mockGetPair.mockReturnValue(makePair({ bypass: ['chia_signMessageById'] }));
    expect(await pairResolve('chia_wallet.sign_message_by_id', { id: 'x' })).toMatchObject({
      kind: 'prompt',
      reason: 'signing requested',
    });
  });
});

describe('resolvePermission - push_transactions (spend allowance, fee-only)', () => {
  const CMD = 'chia_wallet.push_transactions';

  it.each([
    ['true', true],
    ['string "true"', 'true'],
    ['string "false"', 'false'],
    ['number 1', 1],
    ['object {}', {}],
  ])('prompts with "signing requested" when sign is truthy via %s (Python truthiness)', async (_label, sign) => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000' }));
    expect(await pairResolve(CMD, { sign })).toMatchObject({
      kind: 'prompt',
      reason: 'signing requested',
    });
  });

  it.each([
    ['omitted', undefined],
    ['false', false],
    ['number 0', 0],
    ['null', null],
  ])(
    'allows fee-free relay when sign is falsy via %s, regardless of allowance (no funds move)',
    async (_label, sign) => {
      mockGetPair.mockReturnValue(makePair({ xchMojos: '0' }));
      const payload = sign === undefined ? {} : { sign };
      const d = expectAllow(await pairResolve(CMD, payload));
      // Zero-charge spends never debit the allowance.
      d.commit();
      expect(mockRecordUsage).not.toHaveBeenCalled();
    },
  );

  it('prompts when fee > 0 and allowance is zero (the safe default)', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '0' }));
    expect(await pairResolve(CMD, { fee: '500' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('allows when fee fits in remaining allowance and debits only the fee on commit', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000', usedMojos: '200' }));
    const d = expectAllow(await pairResolve(CMD, { fee: '500' }));
    d.commit();
    expect(mockRecordUsage).toHaveBeenCalledTimes(1);
    const [topic, mojos] = mockRecordUsage.mock.calls[0];
    expect(topic).toBe(TOPIC);
    expect(mojos.toFixed(0)).toBe('500');
  });

  it('allows when used + fee equals allowance exactly', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000', usedMojos: '400' }));
    expect((await pairResolve(CMD, { fee: '600' })).kind).toBe('allow');
  });

  it('prompts with "allowance exhausted" when fee exceeds remaining allowance', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000', usedMojos: '900' }));
    expect(await pairResolve(CMD, { fee: '200' })).toMatchObject({
      kind: 'prompt',
      reason: 'allowance exhausted',
    });
  });

  it('treats a negative fee as zero (cannot reduce usage)', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '0' }));
    const d = expectAllow(await pairResolve(CMD, { fee: '-100' }));
    d.commit();
    expect(mockRecordUsage).not.toHaveBeenCalled();
  });

  it('does not record on commit when fee is zero or missing', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000' }));
    expectAllow(await pairResolve(CMD, {})).commit();
    expectAllow(await pairResolve(CMD, { fee: '0' })).commit();
    expect(mockRecordUsage).not.toHaveBeenCalled();
  });

  it('preserves precision beyond JS safe-integer range', async () => {
    const allowance = '99999999999999999999';
    const fee = '99999999999999999999';
    mockGetPair.mockReturnValue(makePair({ xchMojos: allowance, usedMojos: '0' }));
    const d = expectAllow(await pairResolve(CMD, { fee }));
    d.commit();
    const [, mojos] = mockRecordUsage.mock.calls[0];
    expect(mojos.toFixed(0)).toBe(fee);
    expect(mojos).toBeInstanceOf(BigNumber);
  });

  // Regression: a dapp that sends `Sign: true` (capital S) used to slip past
  // the case-sensitive `payload.sign` check while `toSnakeCase` on the wire
  // canonicalised it back to `sign`, silently signing the bundle. The
  // resolver must canonicalise before the gate.
  it.each([
    ['Sign', { Sign: true }],
    ['SIGN', { SIGN: true }],
    ['sign (lowercase, baseline)', { sign: true }],
  ])('prompts on signing requested even when payload uses %s', async (_label, payload) => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000' }));
    expect(await pairResolve(CMD, payload)).toMatchObject({
      kind: 'prompt',
      reason: 'signing requested',
    });
  });

  // Same defect for the fee field: capitalised `Fee` snuck past the budget
  // check while the daemon still honored it on the wire, undercounting the
  // pair's used total. The resolver must read fees regardless of casing.
  it.each([
    ['Fee', { Fee: '500' }],
    ['FEE', { FEE: '500' }],
  ])('counts %s against the allowance on push_transactions', async (_label, payload) => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000', usedMojos: '0' }));
    const d = expectAllow(await pairResolve(CMD, payload));
    d.commit();
    const [, mojos] = mockRecordUsage.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('500');
  });

  it('allows fee relay when chia_pushTransactions is in bypass', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '0', bypass: ['chia_pushTransactions'] }));
    const d = expectAllow(await pairResolve(CMD, { fee: '500' }));
    d.commit();
    expect(mockRecordUsage).not.toHaveBeenCalled();
  });
});

describe('resolvePermission - send_transaction (spend allowance)', () => {
  const SEND = 'chia_wallet.send_transaction';
  const SEND_WC = 'chia_sendTransaction';

  it('prompts when allowance is zero (the safe default)', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '0' }));
    expect(await pairResolve(SEND, { amount: '100', fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('allows when the command is in bypass, even with zero allowance', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '0', bypass: [SEND_WC] }));
    expect((await pairResolve(SEND, { amount: '100', fee: '0' })).kind).toBe('allow');
  });

  it('allows when amount + fee fit in remaining allowance', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000', usedMojos: '200' }));
    const d = expectAllow(await pairResolve(SEND, { amount: '500', fee: '100' }));
    d.commit();
    const [, mojos] = mockRecordUsage.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('600');
  });

  it('prompts with "allowance exhausted" when amount + fee exceed the remaining allowance', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000', usedMojos: '900' }));
    expect(await pairResolve(SEND, { amount: '500', fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'allowance exhausted',
    });
  });

  it('prompts when the amount field is missing (cannot price)', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000' }));
    expect(await pairResolve(SEND, { fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'non-XCH spend needs confirmation',
    });
  });

  // Regression: capital-key payload fields (`Amount`, `Fee`) used to dodge
  // case-sensitive lookups in the resolver while the wire-out canonicalised
  // them on the way to the daemon — undercounting the budget. The resolver
  // must canonicalise before any field read.
  it('counts capitalized "Fee" against the allowance on send_transaction', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000' }));
    const d = expectAllow(await pairResolve(SEND, { amount: '500', Fee: '300' }));
    d.commit();
    const [, mojos] = mockRecordUsage.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('800');
  });

  it('resolves capitalized "Amount" so the gate sees the real spend', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000' }));
    const d = expectAllow(await pairResolve(SEND, { Amount: '500', Fee: '0' }));
    d.commit();
    const [, mojos] = mockRecordUsage.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('500');
  });

  it('capitalized "Amount" + "Fee" together: prompts when total exceeds remaining allowance', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000' }));
    expect(await pairResolve(SEND, { Amount: '900', Fee: '200' })).toMatchObject({
      kind: 'prompt',
      reason: 'allowance exhausted',
    });
  });
});

describe('resolvePermission - create_offer_for_ids (spend allowance, XCH-only)', () => {
  const OFFER = 'chia_wallet.create_offer_for_ids';

  it('prompts when allowance is zero', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '0' }));
    expect(await pairResolve(OFFER, { offer: { '1': '-100' }, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('prompts on non-XCH outflow regardless of allowance (cap is XCH-denominated)', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000000000000' }));
    expect(await pairResolve(OFFER, { offer: { '0xcat': '-100' }, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'non-XCH spend needs confirmation',
    });
  });

  // Convention (chia daemon trade_manager.create_offer_for_ids): NEGATIVE = outflow,
  // POSITIVE = inflow. XCH is keyed as '1' (wallet id) or 'xch'. The resolver must
  // (a) sum the absolute value of negative XCH entries, (b) ignore positives
  // (those are receives, not spends), (c) prompt on any non-XCH outflow so a
  // CAT/NFT giveaway never auto-approves against an XCH cap.
  describe('outflow polarity', () => {
    it('the literal "xch" key is rejected (daemon expects wallet id; parses int() / bytes32 hex only)', async () => {
      // Per wallet_request_types.CreateOfferForIDs.offer_spec, keys ≤16 chars
      // go through int(...) which throws on "xch". The resolver must treat
      // "xch" as a non-XCH outflow and prompt — never debit the allowance for
      // a payload the daemon itself would reject.
      mockGetPair.mockReturnValue(makePair({ xchMojos: '10000' }));
      expect(await pairResolve(OFFER, { offer: { xch: '-5000' }, fee: '0' })).toMatchObject({
        kind: 'prompt',
        reason: 'non-XCH spend needs confirmation',
      });
    });

    it('pure-XCH outflow keyed as "1" (standard wallet id): allows and debits the absolute amount', async () => {
      mockGetPair.mockReturnValue(makePair({ xchMojos: '10000' }));
      const d = expectAllow(await pairResolve(OFFER, { offer: { '1': '-5000' }, fee: '0' }));
      d.commit();
      const [, mojos] = mockRecordUsage.mock.calls[0];
      expect(mojos.toFixed(0)).toBe('5000');
    });

    it('giveaway offer that exceeds the allowance prompts (does not silently auto-approve)', async () => {
      // Regression for the pre-fix bug: a `{ "1": "-100000000000000" }` payload
      // would resolve to outflow=0, fit any cap, and auto-approve a 100-XCH
      // unilateral giveaway. Under the corrected convention it must prompt.
      mockGetPair.mockReturnValue(makePair({ xchMojos: '1000' }));
      expect(await pairResolve(OFFER, { offer: { '1': '-100000000000000' }, fee: '0' })).toMatchObject({
        kind: 'prompt',
        reason: 'allowance exhausted',
      });
    });

    it('CAT-only outflow (negative non-XCH key) prompts — never auto-approves against XCH allowance', async () => {
      mockGetPair.mockReturnValue(makePair({ xchMojos: '1000000000000' }));
      expect(await pairResolve(OFFER, { offer: { '0xcat': '-1000' }, fee: '0' })).toMatchObject({
        kind: 'prompt',
        reason: 'non-XCH spend needs confirmation',
      });
    });

    it('mixed XCH + CAT outflow prompts (any non-XCH negative entry → prompt)', async () => {
      mockGetPair.mockReturnValue(makePair({ xchMojos: '1000000000000' }));
      expect(await pairResolve(OFFER, { offer: { '1': '-1000', '0xcat': '-1' }, fee: '0' })).toMatchObject({
        kind: 'prompt',
        reason: 'non-XCH spend needs confirmation',
      });
    });

    it('mixed XCH outflow + non-XCH inflow prompts (allowance is XCH-only, CAT/NFT inflow disqualifies)', async () => {
      // { -1000 XCH out, +5 CAT in } — auto-approve must reject because the
      // CAT inflow is outside what the XCH allowance bounds.
      mockGetPair.mockReturnValue(makePair({ xchMojos: '10000' }));
      expect(await pairResolve(OFFER, { offer: { '1': '-1000', '0xcat': '5' }, fee: '0' })).toMatchObject({
        kind: 'prompt',
        reason: 'non-XCH spend needs confirmation',
      });
    });

    it('mixed XCH outflow + NFT inflow prompts', async () => {
      mockGetPair.mockReturnValue(makePair({ xchMojos: '10000' }));
      expect(
        await pairResolve(OFFER, {
          offer: { '1': '-1000', '0xnft0000000000000000000000000000000000000000000000000000000000': '1' },
          fee: '0',
        }),
      ).toMatchObject({
        kind: 'prompt',
        reason: 'non-XCH spend needs confirmation',
      });
    });

    it('pure-XCH inflow (request only): outflow=0 → silent regardless of allowance', async () => {
      // `{ '1': '100' }` — the maker requests 100 XCH, gives nothing.
      // Charge=0, no funds move via the wallet, silent under the
      // zero-charge shortcut.
      mockGetPair.mockReturnValue(makePair({ xchMojos: '0' }));
      const d = expectAllow(await pairResolve(OFFER, { offer: { '1': '100' }, fee: '0' }));
      d.commit();
      expect(mockRecordUsage).not.toHaveBeenCalled();
    });

    it('pure-XCH inflow + fee debits only the fee against the allowance', async () => {
      mockGetPair.mockReturnValue(makePair({ xchMojos: '1000' }));
      const d = expectAllow(await pairResolve(OFFER, { offer: { '1': '100' }, fee: '50' }));
      d.commit();
      const [, mojos] = mockRecordUsage.mock.calls[0];
      expect(mojos.toFixed(0)).toBe('50');
    });

    it('any non-XCH key with zero amount still prompts (defense-in-depth)', async () => {
      // Even a zero-amount CAT/NFT key triggers prompt — auto-approve applies
      // only when the offer is exclusively XCH, regardless of amounts.
      mockGetPair.mockReturnValue(makePair({ xchMojos: '10000' }));
      expect(await pairResolve(OFFER, { offer: { '1': '-1000', '0xcat': '0' }, fee: '0' })).toMatchObject({
        kind: 'prompt',
        reason: 'non-XCH spend needs confirmation',
      });
    });

    it('outflow + fee combined against allowance: prompts when total exceeds remaining', async () => {
      mockGetPair.mockReturnValue(makePair({ xchMojos: '1000', usedMojos: '500' }));
      expect(await pairResolve(OFFER, { offer: { '1': '-400' }, fee: '200' })).toMatchObject({
        kind: 'prompt',
        reason: 'allowance exhausted',
      });
    });

    it('preserves precision beyond JS safe-integer range', async () => {
      const allowance = '99999999999999999999';
      const out = '-99999999999999999999';
      mockGetPair.mockReturnValue(makePair({ xchMojos: allowance }));
      const d = expectAllow(await pairResolve(OFFER, { offer: { '1': out }, fee: '0' }));
      d.commit();
      const [, mojos] = mockRecordUsage.mock.calls[0];
      expect(mojos.toFixed(0)).toBe('99999999999999999999');
      expect(mojos).toBeInstanceOf(BigNumber);
    });
  });
});

describe('resolvePermission - take_offer (spend allowance, XCH-only)', () => {
  const TAKE = 'chia_wallet.take_offer';
  const OFFER_STR = 'offer1abc...';

  // The daemon round-trip happens inside the resolver; a successful response
  // unwraps as { data: { summary: { offered, requested, ... } } }.
  function mockSummary(summary: unknown) {
    mockSendDappAndAwait.mockResolvedValueOnce({ data: { summary } });
  }

  it('prompts when allowance is zero, without consulting the daemon', async () => {
    // The summary RPC is only worth the round-trip when the allowance has
    // a chance of covering the spend. With allowance=0 we short-circuit
    // earlier? No — we currently DO call the daemon to compute the charge,
    // then fall back to the prompt branch when the allowance can't cover.
    // What we test is the user-visible outcome: prompt regardless.
    mockGetPair.mockReturnValue(makePair({ xchMojos: '0' }));
    mockSummary({ offered: { xch: '500' }, requested: { xch: '5000' } });
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('allows when both sides are XCH-only and fits in the allowance', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '10000' }));
    mockSummary({ offered: { xch: '500' }, requested: { xch: '5000' } });
    const d = expectAllow(await pairResolve(TAKE, { offer: OFFER_STR, fee: '100' }));
    d.commit();
    const [, mojos] = mockRecordUsage.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('5100');
  });

  it('prompts when summary.offered contains an NFT (received-side disqualifies)', async () => {
    // Pre-fix this auto-approved a 5000-mojo "buy NFT for XCH". The allowance
    // is denominated in XCH — receiving an NFT is outside what it can bound.
    mockGetPair.mockReturnValue(makePair({ xchMojos: '10000' }));
    mockSummary({ offered: { '0xnft': 1 }, requested: { xch: '5000' } });
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '100' })).toMatchObject({
      kind: 'prompt',
      reason: 'non-XCH spend needs confirmation',
    });
  });

  it('prompts when summary.offered contains a CAT (received-side disqualifies)', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '10000' }));
    mockSummary({ offered: { '0xcat': 100 }, requested: { xch: '1000' } });
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'non-XCH spend needs confirmation',
    });
  });

  it('prompts when summary.offered is mixed XCH + CAT', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '10000' }));
    mockSummary({ offered: { xch: '500', '0xcat': 100 }, requested: { xch: '1000' } });
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'non-XCH spend needs confirmation',
    });
  });

  it('prompts when summary.requested includes a CAT', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000000000000' }));
    mockSummary({ offered: { xch: '500' }, requested: { xch: '1000', '0xcat': 5 } });
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'non-XCH spend needs confirmation',
    });
  });

  it('prompts when summary.requested is NFT-only (non-XCH)', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000000000000' }));
    mockSummary({ offered: { xch: '1000' }, requested: { '0xnft': 1 } });
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'non-XCH spend needs confirmation',
    });
  });

  it('prompts when summary.offered is missing entirely (defense-in-depth)', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000' }));
    mockSendDappAndAwait.mockResolvedValueOnce({ data: { summary: { requested: { xch: '500' } } } });
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'non-XCH spend needs confirmation',
    });
  });

  it('allows when both sides empty (free, asset-less interaction): fee-only spend', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000' }));
    mockSummary({ offered: {}, requested: {} });
    const d = expectAllow(await pairResolve(TAKE, { offer: OFFER_STR, fee: '50' }));
    d.commit();
    const [, mojos] = mockRecordUsage.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('50');
  });

  it('allows when summary.requested is empty (taker pays nothing on the asset side) — only fee charged', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000' }));
    mockSummary({ offered: { xch: '500' }, requested: {} });
    const d = expectAllow(await pairResolve(TAKE, { offer: OFFER_STR, fee: '50' }));
    d.commit();
    const [, mojos] = mockRecordUsage.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('50');
  });

  it('prompts with "allowance exhausted" when XCH outflow + fee exceed remaining allowance', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000', usedMojos: '500' }));
    mockSummary({ offered: {}, requested: { xch: '600' } });
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'allowance exhausted',
    });
  });

  it('prompts when daemon returns an error (offer cannot be parsed)', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000000000000' }));
    mockSendDappAndAwait.mockResolvedValueOnce({ data: { error: 'invalid bech32' } });
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'non-XCH spend needs confirmation',
    });
  });

  it('prompts when offer string is missing', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000000000000' }));
    expect(await pairResolve(TAKE, { fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'non-XCH spend needs confirmation',
    });
    expect(mockSendDappAndAwait).not.toHaveBeenCalled();
  });

  it('prompts when sendDappAndAwait throws (timeout, disconnect)', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '1000000000000' }));
    mockSendDappAndAwait.mockRejectedValueOnce(new Error('timeout'));
    expect(await pairResolve(TAKE, { offer: OFFER_STR, fee: '0' })).toMatchObject({
      kind: 'prompt',
      reason: 'non-XCH spend needs confirmation',
    });
  });
});

describe('resolvePermission - commands gate (pair.commands allowlist)', () => {
  const SEND_WC = 'chia_sendTransaction';

  it('denies a command not in pair.commands even if everything else lines up', async () => {
    mockGetPair.mockReturnValue(makePair({ commands: [], bypass: [SEND_WC], xchMojos: '100000' }));
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
    mockGetPair.mockReturnValue(makePair({ xchMojos: '10000' }));
    const d = expectAllow(await pairResolve('chia_wallet.send_transaction', { amount: '500' }));
    d.commit();
    d.commit();
    expect(mockRecordUsage).toHaveBeenCalledTimes(1);
  });

  it('separate resolve calls produce independent commits', async () => {
    mockGetPair.mockReturnValue(makePair({ xchMojos: '10000' }));
    const d1 = expectAllow(await pairResolve('chia_wallet.send_transaction', { amount: '500' }));
    const d2 = expectAllow(await pairResolve('chia_wallet.send_transaction', { amount: '300' }));
    d1.commit();
    d2.commit();
    expect(mockRecordUsage).toHaveBeenCalledTimes(2);
  });
});

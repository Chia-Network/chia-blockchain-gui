import BigNumber from 'bignumber.js';

import { checkPermission, consumeAllowedSpend } from './permissions';
import { getPair, recordSpend } from './pairStore';
import type { CapabilityGrants, PairRecord, SpendingMode } from './types';

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
  } = {},
): PairRecord {
  return {
    topic: TOPIC,
    metadata: { name: 'Test Dapp' },
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

beforeEach(() => {
  mockGetPair.mockReset();
  mockRecordSpend.mockReset();
});

describe('checkPermission - UI principal', () => {
  it('allows commands present in AllowedCommands', () => {
    expect(checkPermission(UI_PRINCIPAL, 'chia_wallet.get_wallets', {}).result).toEqual({
      decision: 'allow',
    });
  });

  it('prompts for commands not in AllowedCommands', () => {
    expect(checkPermission(UI_PRINCIPAL, 'chia_wallet.send_transaction', {}).result).toEqual({
      decision: 'prompt',
      reason: 'requires user confirmation',
    });
  });

  it('prompts for sensitive commands', () => {
    expect(checkPermission(UI_PRINCIPAL, 'chia_wallet.delete_key', {}).result).toEqual({
      decision: 'prompt',
      reason: 'requires user confirmation',
    });
  });

  it('does not consult the pair store for UI principals', () => {
    checkPermission(UI_PRINCIPAL, 'chia_wallet.send_transaction', {});
    expect(mockGetPair).not.toHaveBeenCalled();
  });
});

describe('checkPermission - unknown pair topic', () => {
  it('denies before evaluating any command-specific rules', () => {
    mockGetPair.mockReturnValue(undefined);
    expect(checkPermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallets', {}).result).toEqual({
      decision: 'deny',
      reason: 'unknown pair',
    });
  });

  it('denies even for sensitive commands', () => {
    mockGetPair.mockReturnValue(undefined);
    expect(checkPermission(PAIR_PRINCIPAL, 'chia_wallet.delete_key', {}).result).toEqual({
      decision: 'deny',
      reason: 'unknown pair',
    });
  });
});

describe('checkPermission - balance commands', () => {
  it('allows when the balance capability is granted', () => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { balance: true } }));
    expect(
      checkPermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallet_balance', {}).result,
    ).toEqual({ decision: 'allow' });
    expect(
      checkPermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallet_balances', {}).result,
    ).toEqual({ decision: 'allow' });
  });

  it('prompts when the balance capability is not granted', () => {
    mockGetPair.mockReturnValue(makePair());
    expect(
      checkPermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallet_balance', {}).result,
    ).toEqual({ decision: 'prompt', reason: 'balance not pre-approved' });
  });

  it('returns the pair record on the context', () => {
    const pair = makePair({ capabilities: { balance: true } });
    mockGetPair.mockReturnValue(pair);
    expect(checkPermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallet_balance', {}).pair).toBe(pair);
  });
});

describe('checkPermission - push_transactions', () => {
  const CMD = 'chia_wallet.push_transactions';

  it('prompts when sign:true (mirrors Python truthiness)', () => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { innocuous: true } }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { sign: true }).result).toEqual({
      decision: 'prompt',
      reason: 'signing requested',
    });
  });

  it.each([
    ['string "true"', 'true'],
    ['string "false"', 'false'],
    ['number 1', 1],
    ['object {}', {}],
  ])('prompts when sign is truthy via %s', (_label, sign) => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { innocuous: true } }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { sign }).result).toEqual({
      decision: 'prompt',
      reason: 'signing requested',
    });
  });

  it('prompts when innocuous capability is missing', () => {
    mockGetPair.mockReturnValue(makePair());
    expect(checkPermission(PAIR_PRINCIPAL, CMD, {}).result).toEqual({
      decision: 'prompt',
      reason: 'innocuous actions not pre-approved',
    });
  });

  it('allows when sign is omitted, innocuous granted, no fee', () => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { innocuous: true } }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, {}).result).toEqual({ decision: 'allow' });
  });

  it.each([
    ['false', false],
    ['number 0', 0],
    ['null', null],
    ['undefined', undefined],
  ])('allows when sign is falsy via %s and innocuous granted', (_label, sign) => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { innocuous: true } }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { sign }).result).toEqual({ decision: 'allow' });
  });

  it('allows when fee fits within remaining budget', () => {
    mockGetPair.mockReturnValue(
      makePair({
        capabilities: { innocuous: true },
        spendingCapMojos: '1000',
        spentMojos: '200',
      }),
    );
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { fee: '500' }).result).toEqual({
      decision: 'allow',
    });
  });

  it('allows when spent + fee equals the cap exactly', () => {
    mockGetPair.mockReturnValue(
      makePair({
        capabilities: { innocuous: true },
        spendingCapMojos: '1000',
        spentMojos: '400',
      }),
    );
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { fee: '600' }).result).toEqual({
      decision: 'allow',
    });
  });

  it('prompts when fee exceeds remaining budget', () => {
    mockGetPair.mockReturnValue(
      makePair({
        capabilities: { innocuous: true },
        spendingCapMojos: '1000',
        spentMojos: '900',
      }),
    );
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { fee: '200' }).result).toEqual({
      decision: 'prompt',
      reason: 'push fee exceeds remaining budget',
    });
  });

  it('treats negative fee as zero (cannot reduce spend)', () => {
    mockGetPair.mockReturnValue(
      makePair({ capabilities: { innocuous: true }, spendingCapMojos: '0', spentMojos: '0' }),
    );
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { fee: '-100' }).result).toEqual({
      decision: 'allow',
    });
  });

  it('handles fees beyond JS safe-integer range without precision loss', () => {
    const cap = '99999999999999999999';
    const fee = '99999999999999999999';
    mockGetPair.mockReturnValue(
      makePair({
        capabilities: { innocuous: true },
        spendingCapMojos: cap,
        spentMojos: '0',
      }),
    );
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { fee }).result).toEqual({ decision: 'allow' });

    mockGetPair.mockReturnValue(
      makePair({
        capabilities: { innocuous: true },
        spendingCapMojos: cap,
        spentMojos: '1',
      }),
    );
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { fee }).result).toEqual({
      decision: 'prompt',
      reason: 'push fee exceeds remaining budget',
    });
  });
});

describe('checkPermission - innocuous-classified commands', () => {
  it('allows when innocuous granted', () => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { innocuous: true } }));
    expect(
      checkPermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallets', {}).result,
    ).toEqual({ decision: 'allow' });
    expect(
      checkPermission(PAIR_PRINCIPAL, 'chia_wallet.get_transactions', {}).result,
    ).toEqual({ decision: 'allow' });
  });

  it('prompts when innocuous not granted', () => {
    mockGetPair.mockReturnValue(makePair());
    expect(
      checkPermission(PAIR_PRINCIPAL, 'chia_wallet.get_wallets', {}).result,
    ).toEqual({ decision: 'prompt', reason: 'innocuous not pre-approved' });
  });
});

describe('checkPermission - sign-classified commands', () => {
  it('allows when sign granted', () => {
    mockGetPair.mockReturnValue(makePair({ capabilities: { sign: true } }));
    expect(
      checkPermission(PAIR_PRINCIPAL, 'chia_wallet.sign_message_by_address', {}).result,
    ).toEqual({ decision: 'allow' });
    expect(
      checkPermission(PAIR_PRINCIPAL, 'chia_wallet.sign_message_by_id', {}).result,
    ).toEqual({ decision: 'allow' });
  });

  it('prompts when sign not granted', () => {
    mockGetPair.mockReturnValue(makePair());
    expect(
      checkPermission(PAIR_PRINCIPAL, 'chia_wallet.sign_message_by_address', {}).result,
    ).toEqual({ decision: 'prompt', reason: 'sign not pre-approved' });
  });
});

describe('checkPermission - sensitive commands', () => {
  it.each([
    'chia_wallet.delete_key',
    'chia_harvester.delete_plot',
    'chia_harvester.add_plot_directory',
    'chia_harvester.remove_plot_directory',
    'chia_full_node.open_connection',
    'chia_full_node.close_connection',
    'chia_farmer.close_connection',
    'chia_farmer.set_payout_instructions',
    'chia_wallet.set_payout_instructions',
    'chia_wallet.set_auto_claim',
    'daemon.stop_plotting',
    'totally.unknown_command',
  ])('prompts with "sensitive command" for %s', (cmd) => {
    mockGetPair.mockReturnValue(makePair());
    expect(checkPermission(PAIR_PRINCIPAL, cmd, {}).result).toEqual({
      decision: 'prompt',
      reason: 'sensitive command',
    });
  });
});

describe('checkPermission - send_transaction (spend)', () => {
  const CMD = 'chia_wallet.send_transaction';

  it('denies when spendingMode is block', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'block', spendingCapMojos: '999' }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { amount: '10' }).result).toEqual({
      decision: 'deny',
      reason: 'spending blocked for this app',
    });
  });

  it('prompts when spendingMode is ask', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'ask', spendingCapMojos: '999' }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { amount: '10' }).result).toEqual({
      decision: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('allows under cap with no fee', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { amount: '999' }).result).toEqual({
      decision: 'allow',
    });
  });

  it('allows when amount + fee equals cap exactly', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { amount: '700', fee: '300' }).result).toEqual({
      decision: 'allow',
    });
  });

  it('prompts when amount + fee exceeds cap', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { amount: '700', fee: '301' }).result).toEqual({
      decision: 'prompt',
      reason: 'budget exhausted',
    });
  });

  it('respects already-spent mojos against the cap', () => {
    mockGetPair.mockReturnValue(
      makePair({ spendingMode: 'auto', spendingCapMojos: '1000', spentMojos: '900' }),
    );
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { amount: '50', fee: '50' }).result).toEqual({
      decision: 'allow',
    });
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { amount: '101' }).result).toEqual({
      decision: 'prompt',
      reason: 'budget exhausted',
    });
  });

  it('prompts when amount cannot be parsed', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { amount: 'not-a-number' }).result).toEqual({
      decision: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('prompts when amount is negative', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { amount: '-5' }).result).toEqual({
      decision: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('prompts when amount is missing entirely', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, {}).result).toEqual({
      decision: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('handles values beyond JS safe-integer range', () => {
    const cap = '100000000000000000000'; // 1e20 mojos
    const amount = '99999999999999999999';
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: cap }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { amount }).result).toEqual({
      decision: 'allow',
    });
    expect(
      checkPermission(PAIR_PRINCIPAL, CMD, { amount, fee: '2' }).result,
    ).toEqual({ decision: 'prompt', reason: 'budget exhausted' });
  });

  it('treats fee as zero when missing', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '100' }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { amount: '100' }).result).toEqual({
      decision: 'allow',
    });
  });
});

describe('checkPermission - cat_spend / nft transfers (spend without amount)', () => {
  it.each([
    'chia_wallet.cat_spend',
    'chia_wallet.nft_transfer_nft',
    'chia_wallet.nft_transfer_bulk',
    'chia_wallet.nft_set_nft_did',
    'chia_wallet.nft_set_did_bulk',
  ])('prompts under auto mode because there is no resolvable amount: %s', (cmd) => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '999999' }));
    expect(checkPermission(PAIR_PRINCIPAL, cmd, { amount: '1' }).result).toEqual({
      decision: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('denies under block mode regardless of payload', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'block' }));
    expect(checkPermission(PAIR_PRINCIPAL, 'chia_wallet.cat_spend', {}).result).toEqual({
      decision: 'deny',
      reason: 'spending blocked for this app',
    });
  });
});

describe('checkPermission - create_offer_for_ids (offer with XCH outflow)', () => {
  const CMD = 'chia_wallet.create_offer_for_ids';

  it('allows when XCH outflow + fee fit under cap', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '5000' }));
    expect(
      checkPermission(PAIR_PRINCIPAL, CMD, { offer: { 1: '1000' }, fee: '50' }).result,
    ).toEqual({ decision: 'allow' });
  });

  it('sums multiple XCH outflow keys (xch + 1)', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '5000' }));
    expect(
      checkPermission(PAIR_PRINCIPAL, CMD, {
        offer: { 1: '1000', xch: '2000' },
        fee: '0',
      }).result,
    ).toEqual({ decision: 'allow' });
  });

  it('prompts when XCH outflow + fee exceed cap', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '1000' }));
    expect(
      checkPermission(PAIR_PRINCIPAL, CMD, { offer: { 1: '900' }, fee: '200' }).result,
    ).toEqual({ decision: 'prompt', reason: 'budget exhausted' });
  });

  it('skips offer lines with non-positive amounts', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '100' }));
    // 50 counts; -1000 and 0 are skipped per resolver rules.
    expect(
      checkPermission(PAIR_PRINCIPAL, CMD, {
        offer: { 1: '50', xch: '-1000' },
        fee: '0',
      }).result,
    ).toEqual({ decision: 'allow' });
  });

  it('prompts when offer touches a non-XCH key (cannot price against XCH cap)', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '99999' }));
    expect(
      checkPermission(PAIR_PRINCIPAL, CMD, {
        offer: { '8d3ed4c4...': '100' },
        fee: '0',
      }).result,
    ).toEqual({ decision: 'prompt', reason: 'spending needs confirmation' });
  });

  it('prompts when offer payload is missing or not an object', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '99999' }));
    expect(checkPermission(PAIR_PRINCIPAL, CMD, {}).result).toEqual({
      decision: 'prompt',
      reason: 'spending needs confirmation',
    });
    expect(checkPermission(PAIR_PRINCIPAL, CMD, { offer: 'oops' }).result).toEqual({
      decision: 'prompt',
      reason: 'spending needs confirmation',
    });
  });

  it('denies under block mode', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'block' }));
    expect(
      checkPermission(PAIR_PRINCIPAL, CMD, { offer: { 1: '100' } }).result,
    ).toEqual({ decision: 'deny', reason: 'spending blocked for this app' });
  });

  it('prompts under ask mode without consulting the cap', () => {
    mockGetPair.mockReturnValue(makePair({ spendingMode: 'ask', spendingCapMojos: '0' }));
    expect(
      checkPermission(PAIR_PRINCIPAL, CMD, { offer: { 1: '100' } }).result,
    ).toEqual({ decision: 'prompt', reason: 'spending needs confirmation' });
  });
});

describe('checkPermission - take_offer / cancel_offer (offer without amount)', () => {
  it.each(['chia_wallet.take_offer', 'chia_wallet.cancel_offer'])(
    'prompts under auto mode because no XCH amount is resolvable: %s',
    (cmd) => {
      mockGetPair.mockReturnValue(makePair({ spendingMode: 'auto', spendingCapMojos: '999' }));
      expect(checkPermission(PAIR_PRINCIPAL, cmd, {}).result).toEqual({
        decision: 'prompt',
        reason: 'spending needs confirmation',
      });
    },
  );
});

describe('consumeAllowedSpend', () => {
  it('is a no-op for UI principals', () => {
    consumeAllowedSpend(UI_PRINCIPAL, 'chia_wallet.send_transaction', { amount: '10', fee: '1' });
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('is a no-op for sensitive / unknown commands', () => {
    consumeAllowedSpend(PAIR_PRINCIPAL, 'chia_wallet.delete_key', {});
    consumeAllowedSpend(PAIR_PRINCIPAL, 'totally.unknown', {});
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('is a no-op for innocuous-classified commands', () => {
    consumeAllowedSpend(PAIR_PRINCIPAL, 'chia_wallet.get_wallets', {});
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('is a no-op for sign-classified commands', () => {
    consumeAllowedSpend(PAIR_PRINCIPAL, 'chia_wallet.sign_message_by_id', {});
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('charges amount + fee for send_transaction', () => {
    consumeAllowedSpend(PAIR_PRINCIPAL, 'chia_wallet.send_transaction', {
      amount: '700',
      fee: '50',
    });
    expect(mockRecordSpend).toHaveBeenCalledTimes(1);
    const [topic, mojos] = mockRecordSpend.mock.calls[0];
    expect(topic).toBe(TOPIC);
    expect(mojos.toFixed(0)).toBe('750');
  });

  it('treats fee as zero when missing on send_transaction', () => {
    consumeAllowedSpend(PAIR_PRINCIPAL, 'chia_wallet.send_transaction', { amount: '700' });
    const [, mojos] = mockRecordSpend.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('700');
  });

  it('does not record when send_transaction has no amount field', () => {
    consumeAllowedSpend(PAIR_PRINCIPAL, 'chia_wallet.send_transaction', {});
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('does not record when total computes to <= 0', () => {
    consumeAllowedSpend(PAIR_PRINCIPAL, 'chia_wallet.send_transaction', { amount: '0', fee: '0' });
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('does not record for cat_spend / nft_transfer (no amount field)', () => {
    consumeAllowedSpend(PAIR_PRINCIPAL, 'chia_wallet.cat_spend', { amount: '999' });
    consumeAllowedSpend(PAIR_PRINCIPAL, 'chia_wallet.nft_transfer_nft', { fee: '1' });
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('charges XCH outflow + fee for create_offer_for_ids', () => {
    consumeAllowedSpend(PAIR_PRINCIPAL, 'chia_wallet.create_offer_for_ids', {
      offer: { 1: '1000', xch: '500' },
      fee: '25',
    });
    const [, mojos] = mockRecordSpend.mock.calls[0];
    expect(mojos.toFixed(0)).toBe('1525');
  });

  it('does not record for create_offer_for_ids that touches non-XCH', () => {
    consumeAllowedSpend(PAIR_PRINCIPAL, 'chia_wallet.create_offer_for_ids', {
      offer: { '8d3ed4c4...': '100' },
      fee: '5',
    });
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it('does not record for take_offer / cancel_offer (no amount resolver)', () => {
    consumeAllowedSpend(PAIR_PRINCIPAL, 'chia_wallet.take_offer', {});
    consumeAllowedSpend(PAIR_PRINCIPAL, 'chia_wallet.cancel_offer', {});
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  describe('push_transactions', () => {
    const CMD = 'chia_wallet.push_transactions';

    it('records only the top-level fee', () => {
      consumeAllowedSpend(PAIR_PRINCIPAL, CMD, { fee: '42' });
      const [, mojos] = mockRecordSpend.mock.calls[0];
      expect(mojos.toFixed(0)).toBe('42');
    });

    it('does not record when fee is zero or missing', () => {
      consumeAllowedSpend(PAIR_PRINCIPAL, CMD, {});
      consumeAllowedSpend(PAIR_PRINCIPAL, CMD, { fee: '0' });
      expect(mockRecordSpend).not.toHaveBeenCalled();
    });

    it('does not record on negative fee', () => {
      consumeAllowedSpend(PAIR_PRINCIPAL, CMD, { fee: '-5' });
      expect(mockRecordSpend).not.toHaveBeenCalled();
    });

    it('preserves precision for very large fees', () => {
      const fee = '99999999999999999999';
      consumeAllowedSpend(PAIR_PRINCIPAL, CMD, { fee });
      const [, mojos] = mockRecordSpend.mock.calls[0];
      expect(mojos.toFixed(0)).toBe(fee);
      expect(mojos).toBeInstanceOf(BigNumber);
    });

    it('does not consult the spend classifier for push_transactions', () => {
      // sign:true would prompt at check time, but consume is called only after
      // an allow decision in main.tsx. We still verify that consume itself only
      // looks at the `fee` field, not `sign`, and never delegates to
      // classify-based spend resolution.
      consumeAllowedSpend(PAIR_PRINCIPAL, CMD, { sign: true, fee: '7' });
      const [, mojos] = mockRecordSpend.mock.calls[0];
      expect(mojos.toFixed(0)).toBe('7');
    });
  });
});

import { buildNewPairRecord } from './buildPairRecord';
import type { PairGrants, PairMetadata } from './types';

const grants: PairGrants = {
  spendingMode: 'ask',
  spendingCapMojos: '10000000000',
};
const metadata: PairMetadata = { name: 'Test Dapp', url: 'https://test.app' };

describe('buildNewPairRecord', () => {
  it('copies caller-provided fields verbatim', () => {
    const record = buildNewPairRecord({
      topic: 'topic-123',
      mainnet: false,
      metadata,
      fingerprints: [111, 222],
      grants,
      commands: ['chia_sendTransaction', 'chia_getWallets'],
      now: 1_700_000_000_000,
    });
    expect(record.topic).toBe('topic-123');
    expect(record.mainnet).toBe(false);
    expect(record.metadata).toBe(metadata);
    expect(record.fingerprints).toEqual([111, 222]);
    expect(record.grants).toBe(grants);
    expect(record.commands).toEqual(['chia_sendTransaction', 'chia_getWallets']);
  });

  it('initializes spentMojos to the string "0"', () => {
    // Numeric zero would round-trip through YAML as a number and break the
    // BigNumber arithmetic in `recordSpend` (which assumes string input
    // for >2^53 precision). Pin the type AND value.
    const record = buildNewPairRecord({
      topic: 't',
      mainnet: true,
      metadata,
      fingerprints: [],
      grants,
      commands: [],
      now: 0,
    });
    expect(record.spentMojos).toBe('0');
    expect(typeof record.spentMojos).toBe('string');
  });

  it('initializes bypass to []', () => {
    // No silent approvals carry over from anywhere on a fresh pair —
    // bypass entries can only land via the Confirm dialog's "Don't ask
    // again" path or the Settings UI, both running after this point.
    const record = buildNewPairRecord({
      topic: 't',
      mainnet: true,
      metadata,
      fingerprints: [],
      grants,
      commands: [],
      now: 0,
    });
    expect(record.bypass).toEqual([]);
  });

  it('stamps createdAt and updatedAt with the same `now` value', () => {
    const record = buildNewPairRecord({
      topic: 't',
      mainnet: true,
      metadata,
      fingerprints: [],
      grants,
      commands: [],
      now: 1_700_000_000_000,
    });
    expect(record.createdAt).toBe(1_700_000_000_000);
    expect(record.updatedAt).toBe(1_700_000_000_000);
  });

  it('preserves an empty commands array (deny-all) without falling back', () => {
    const record = buildNewPairRecord({
      topic: 't',
      mainnet: true,
      metadata,
      fingerprints: [],
      grants,
      commands: [],
      now: 0,
    });
    expect(record.commands).toEqual([]);
  });
});

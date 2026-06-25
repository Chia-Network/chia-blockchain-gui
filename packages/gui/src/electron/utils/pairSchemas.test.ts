import { toPairPublicRecord, type PairRecord } from './pairSchemas';

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
    updatedAt: 200,
    commands: ['chia_logIn'],
    bypass: ['chia_sendTransaction'],
    ...overrides,
  };
}

describe('toPairPublicRecord', () => {
  it('returns only renderer-safe pair fields', () => {
    expect(toPairPublicRecord(makePair())).toEqual({
      topic: 'topic-1',
      mainnet: true,
      metadata: {
        name: 'Test dApp',
        url: 'https://example.com',
        icon: 'https://example.com/icon.png',
        description: 'Example',
      },
      fingerprint: 123_456,
      commands: ['chia_logIn'],
      hasBypass: true,
    });
  });

  it('summarizes bypass permissions without exposing command names', () => {
    expect(toPairPublicRecord(makePair({ bypass: [] }))).toMatchObject({
      hasBypass: false,
    });
  });
});

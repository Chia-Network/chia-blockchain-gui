import compareChecksums from './compareChecksums';

describe('compareChecksums', () => {
  it('compares full hashes with or without the 0x prefix', () => {
    expect(compareChecksums('0xabc123', 'abc123')).toBe(true);
    expect(compareChecksums('abc123', '0xabc123')).toBe(true);
    expect(compareChecksums('abc123', 'abc124')).toBe(false);
  });

  it.each([{}, 5, ['abc123'], null, undefined, true])('matches nothing when a hash is %p', (hash) => {
    expect(compareChecksums('abc123', hash as unknown as string)).toBe(false);
    expect(compareChecksums(hash as unknown as string, 'abc123')).toBe(false);
  });
});

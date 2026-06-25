import parseCreateOfferForIdsKey from './parseCreateOfferForIdsKey';

describe('parseCreateOfferForIdsKey', () => {
  it('parses ASCII wallet id keys (same branch as len <= 16 in offer_spec)', () => {
    expect(parseCreateOfferForIdsKey('1')).toEqual({ type: 'walletId', walletId: 1 });
    expect(parseCreateOfferForIdsKey('0')).toEqual({ type: 'walletId', walletId: 0 });
    expect(parseCreateOfferForIdsKey(' 12 ')).toEqual({ type: 'walletId', walletId: 12 });
    expect(parseCreateOfferForIdsKey('4294967295')).toEqual({ type: 'walletId', walletId: 4_294_967_295 });
  });

  it('parses 64-hex asset keys (same branch as len > 16 in offer_spec)', () => {
    const hex = '8d3ed4c44a1ad053907044f12c8ba0f6a4fdad4eeff585ec76580b50a8de3d2d';
    expect(parseCreateOfferForIdsKey(hex)).toEqual({ type: 'assetHex', normalizedHex: hex });
    expect(parseCreateOfferForIdsKey(`0x${hex}`)).toEqual({ type: 'assetHex', normalizedHex: hex });
  });

  it('rejects fullwidth digits (Python int() rejects; JS Number() would not)', () => {
    const fullwidthOne = '\uFF11'; // "１"
    expect(() => parseCreateOfferForIdsKey(fullwidthOne)).toThrow(/Invalid wallet id key/);
  });

  it('rejects other unicode decimal digits (e.g. Arabic-Indic)', () => {
    expect(() => parseCreateOfferForIdsKey('\u0661')).toThrow(/Invalid wallet id key/);
  });

  it('rejects keys that are not 64 hex when len > 16', () => {
    expect(() => parseCreateOfferForIdsKey('12345678901234567')).toThrow(/Invalid asset id key/);
  });

  it('rejects wallet id values above uint32', () => {
    expect(() => parseCreateOfferForIdsKey('4294967296')).toThrow(/uint32 range/);
  });

  it('treats length exactly 16 as wallet id path (not hex)', () => {
    expect(parseCreateOfferForIdsKey('0000000000000001')).toEqual({
      type: 'walletId',
      walletId: 1,
    });
  });
});

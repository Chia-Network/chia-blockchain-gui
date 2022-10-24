import getUnknownCATs from './getUnknownCATs';
import { WalletType } from '@chia/api';

describe('getUnknownCATs', () => {
  describe('all assetIds found', () => {
    it('returns empty array', () => {
      const cats = ['abc123', 'DEF456'];
      const wallets = [
        { type: WalletType.STANDARD_WALLET },
        {
          type: WalletType.CAT,
          meta: { assetId: cats[0] },
        },
        {
          type: WalletType.CAT,
          meta: { assetId: cats[1] },
        },
        {
          type: WalletType.NFT,
        },
      ];
      expect(getUnknownCATs(wallets, cats)).toEqual([]);
    });
  });
  describe('mixed case assetId is found', () => {
    it('returns empty array', () => {
      const cat = 'abc123';
      const mixedCaseCat = 'AbC123';
      const wallets = [{ type: WalletType.CAT, meta: { assetId: cat } }];
      expect(getUnknownCATs(wallets, [mixedCaseCat])).toEqual([]);
    });
  });
  describe('no wallets, no assetIds', () => {
    it('returns empty array', () => {
      expect(getUnknownCATs([], [])).toEqual([]);
    });
  });
  describe('missing assetIds', () => {
    it('returns missing assetIds', () => {
      const cats = ['abc123', 'DEF456'];
      const wallets = [
        { type: WalletType.STANDARD_WALLET },
        {
          type: WalletType.CAT,
          meta: { assetId: cats[0] },
        },
        {
          type: WalletType.NFT,
        },
      ];
      expect(getUnknownCATs(wallets, cats)).toEqual([cats[1]]);
    });
  });
});

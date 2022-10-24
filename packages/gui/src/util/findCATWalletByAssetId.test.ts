import { WalletType } from '@chia/api';
import findCATWalletByAssetId from './findCATWalletByAssetId';

describe('findCATWalletByAssetId', () => {
  describe('no wallets, empty assetId', () => {
    it('returns undefined', () => {
      expect(findCATWalletByAssetId([], '')).toBeUndefined();
    });
  });
  describe('assetId not found', () => {
    it('returns undefined', () => {
      const wallets = [
        {
          type: WalletType.CAT,
          meta: { assetId: 'abc123' },
        },
      ];
      expect(findCATWalletByAssetId(wallets, 'def456')).toBeUndefined();
    });
  });
  describe('assetId found', () => {
    it('returns wallet', () => {
      const cat = 'abc123';
      const wallets = [
        {
          type: WalletType.CAT,
          meta: { assetId: cat },
        },
      ];
      expect(findCATWalletByAssetId(wallets, cat)).toEqual(wallets[0]);
    });
  });
  describe('mixed case assetId is found', () => {
    it('returns wallet', () => {
      const cat = 'abc123';
      const mixedCaseCat = 'AbC123';
      const wallets = [
        {
          type: WalletType.CAT,
          meta: { assetId: cat },
        },
      ];
      expect(findCATWalletByAssetId(wallets, mixedCaseCat)).toEqual(wallets[0]);
    });
  });
});

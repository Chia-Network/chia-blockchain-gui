import { WalletType } from '@chia/api';
import { getNFTInbox } from './utils';

describe('utils', () => {
  describe('getNFTInbox', () => {
    it('should return undefined if no wallets are provided', () => {
      expect(getNFTInbox(undefined)).toBeUndefined();
    });

    it('should return undefined if all of the NFT wallets have an associated DID', () => {
      const nftWallets = [
        {
          id: 3,
          type: WalletType.NFT,
          name: 'NFT 1',
          meta: {
            did: 'did_1',
          },
        },
        {
          id: 4,
          type: WalletType.NFT,
          name: 'NFT 2',
          meta: {
            did: 'did_2',
          },
        },
      ];

      expect(getNFTInbox(nftWallets)).toBeUndefined();
    });

    it('should return undefined if no NFT wallets are present', () => {
      const wallets = [
        {
          id: 1,
          type: WalletType.STANDARD_WALLET,
          name: 'Chia',
        },
        {
          id: 2,
          type: WalletType.CAT,
          name: 'Duck Sauce',
        },
      ];

      expect(getNFTInbox(wallets)).toBeUndefined();
    });

    it("should return the inbox when an NFT wallet doesn't have an associated DID", () => {
      const wallets = [
        {
          id: 1,
          type: WalletType.STANDARD_WALLET,
          name: 'Chia',
        },
        {
          id: 2,
          type: WalletType.CAT,
          name: 'Duck Sauce',
        },
        {
          id: 3,
          type: WalletType.NFT,
          name: 'NFT 1',
          meta: {
            did: 'did_1',
          },
        },
        {
          id: 4,
          type: WalletType.NFT,
          name: 'NFT 2',
          meta: {
            did: '',
          },
        },
      ];

      expect(getNFTInbox(wallets)).toEqual(wallets[3]);
    });
  });
});

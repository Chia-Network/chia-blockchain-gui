import type BigNumber from 'bignumber.js';

import type CalculateRoyaltiesRequest from '../@types/CalculateRoyaltiesRequest';
import type Coin from '../@types/Coin';
import type NFTInfo from '../@types/NFTInfo';
import type SpendBundle from '../@types/SpendBundle';
import type Transaction from '../@types/Transaction';
import Wallet, { type AllowUnsyncedArg } from '../services/WalletService';

export default class NFTWallet extends Wallet {
  async getNftsCount(args: { walletId: number }) {
    return this.command('nft_count_nfts', args);
  }

  async getNfts(args: { walletId: number; num: number; startIndex: number }) {
    return this.command('nft_get_nfts', args);
  }

  async getNftInfo(args: { coinId: string }) {
    return this.command<{
      nftInfo: NFTInfo;
    }>('nft_get_info', args);
  }

  async getNftWalletsWithDids() {
    return this.command<{
      nftWallets: {
        walletId: number;
        didId: string;
        didWalletId: number;
      }[];
    }>('nft_get_wallets_with_dids');
  }

  async getNftWalletDid(args: { walletId: number }) {
    return this.command<{
      didId: string;
    }>('nft_get_wallet_did', args);
  }

  async mintBulk(
    args: {
      walletId: number;
      metadataList: Array<{
        uris: string[];
        metaUris: string[];
        licenseUris: string[];
        hash: string;
        editionNumber?: number;
        editionTotal?: number;
        metaHash?: string;
        licenseHash?: string;
      }>;
      royaltyPercentage?: number;
      royaltyAddress?: string;
      targetList?: string[];
      mintNumberStart?: number;
      mintTotal?: number;
      xchCoins?: Coin[];
      xchChangeTarget?: string;
      newInnerpuzhash?: string;
      newP2Puzhash?: string;
      didCoin?: Coin;
      didLineageParent?: string;
      mintFromDid?: boolean;
      fee?: number;
      reusePuzhash?: boolean;
    } & AllowUnsyncedArg,
  ) {
    return this.command<
      | {
          success: true;
          spendBundle: SpendBundle;
          nftIdList: string[];
          transactions: Transaction[];
          signingResponse?: string;
        }
      | {
          success: false;
          error: string;
        }
    >('nft_mint_bulk', args);
  }

  async mintNFT(
    args: {
      walletId: number;
      royaltyAddress: string;
      royaltyPercentage: string;
      targetAddress: string;
      uris: string[];
      hash: string;
      metaUris: string[];
      metaHash: string;
      licenseUris: string[];
      licenseHash: string;
      editionNumber: number;
      editionTotal: number;
      didId: string;
      fee: string;
    } & AllowUnsyncedArg,
  ) {
    const {
      walletId,
      royaltyAddress,
      royaltyPercentage,
      targetAddress,
      uris,
      hash,
      metaUris,
      metaHash,
      licenseUris,
      licenseHash,
      editionNumber,
      editionTotal,
      didId,
      fee,
      allowUnsynced,
    } = args;
    const extra = allowUnsynced != null ? { allowUnsynced } : {};
    return this.command<{
      walletId: number;
      spendBundle: SpendBundle;
      nftId: string;
    }>('nft_mint_nft', {
      walletId,
      royaltyAddress,
      royaltyPercentage,
      targetAddress,
      uris,
      hash,
      metaUris,
      metaHash,
      licenseUris,
      licenseHash,
      editionNumber,
      editionTotal,
      didId,
      fee,
      ...extra,
    });
  }

  async transferNft(args: { walletId: number; nftCoinIds: string[]; targetAddress: string; fee: string } & AllowUnsyncedArg) {
    const { walletId, nftCoinIds, targetAddress, fee, allowUnsynced } = args;
    const extra = allowUnsynced != null ? { allowUnsynced } : {};
    if (nftCoinIds.length === 1) {
      return this.command<{
        walletId: number;
        spendBundle: SpendBundle;
      }>('nft_transfer_nft', {
        walletId,
        nftCoinId: nftCoinIds[0],
        targetAddress,
        fee,
        ...extra,
      });
    }
    return this.command<{
      walletId: number[];
      spendBundle: SpendBundle;
      txNum: number;
    }>('nft_transfer_bulk', {
      nftCoinList: nftCoinIds.map((nftId: string) => ({ nft_coin_id: nftId, wallet_id: walletId })),
      targetAddress,
      fee,
      ...extra,
    });
  }

  async setNftDid(args: { walletId: number; nftCoinIds: string[]; did: string; fee: string } & AllowUnsyncedArg) {
    const { walletId, nftCoinIds, did, fee, allowUnsynced } = args;
    const extra = allowUnsynced != null ? { allowUnsynced } : {};
    if (nftCoinIds.length === 1) {
      return this.command<{
        walletId: number;
        spendBundle: SpendBundle;
      }>('nft_set_nft_did', {
        walletId,
        nftCoinId: nftCoinIds[0],
        didId: did,
        fee,
        ...extra,
      });
    }
    return this.command<{
      walletId: number[];
      spendBundle: SpendBundle;
      txNum: number;
    }>('nft_set_did_bulk', {
      nftCoinList: nftCoinIds.map((nftId: string) => ({ nft_coin_id: nftId, wallet_id: walletId })),
      didId: did,
      fee,
      ...extra,
    });
  }

  async setNftStatus(args: { walletId: number; nftCoinId: string; inTransaction: boolean } & AllowUnsyncedArg) {
    const { walletId, nftCoinId, inTransaction } = args;
    return this.command<void>('nft_set_nft_status', {
      walletId,
      coinId: nftCoinId,
      inTransaction,
      ...(args.allowUnsynced != null ? { allowUnsynced: args.allowUnsynced } : {}),
    });
  }

  async calculateRoyalties(args: CalculateRoyaltiesRequest) {
    return this.command<Record<string, Array<{ asset: string; address: string; amount: BigNumber | number }>>>(
      'nft_calculate_royalties',
      args,
    );
  }
}

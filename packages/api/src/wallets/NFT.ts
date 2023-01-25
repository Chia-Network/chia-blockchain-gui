import { CalculateRoyaltiesRequest } from '../@types';
import Wallet from '../services/WalletService';

export default class NFTWallet extends Wallet {
  async getNfts(walletId: number) {
    return this.command('nft_get_nfts', {
      walletId,
    });
  }

  async getNftInfo(coinId: string) {
    return this.command('nft_get_info', {
      coinId,
    });
  }

  async getNftWalletsWithDids() {
    return this.command('nft_get_wallets_with_dids');
  }

  async getNftWalletDid(walletId: number) {
    return this.command('nft_get_wallet_did', {
      walletId,
    });
  }

  async transferNft(walletId: number, nftCoinIds: string[], targetAddress: string, fee: string) {
    if (nftCoinIds.length === 1) {
      return this.command('nft_transfer_nft', {
        walletId,
        nftCoinId: nftCoinIds[0],
        targetAddress,
        fee,
      });
    }
    return this.command('nft_transfer_bulk', {
      nftCoinList: nftCoinIds.map((nftId: string) => ({ nft_coin_id: nftId, wallet_id: walletId })),
      targetAddress,
      fee,
    });
  }

  async setNftDid(walletId: number, nftCoinIds: string[], did: string, fee: string) {
    if (nftCoinIds.length === 1) {
      return this.command('nft_set_nft_did', {
        walletId,
        nftCoinId: nftCoinIds[0],
        didId: did,
        fee,
      });
    }
    return this.command('nft_set_did_bulk', {
      nftCoinList: nftCoinIds.map((nftId: string) => ({ nft_coin_id: nftId, wallet_id: walletId })),
      didId: did,
      fee,
    });
  }

  async setNftStatus(walletId: number, nftCoinId: string, inTransaction: boolean) {
    return this.command('nft_set_nft_status', {
      walletId,
      coinId: nftCoinId,
      inTransaction,
    });
  }

  async receiveNft(walletId: number, spendBundle: any, fee: number) {
    return this.command('nft_receive_nft', {
      walletId,
      spendBundle,
      fee,
    });
  }

  async calculateRoyalties(req: CalculateRoyaltiesRequest): Promise<Record<string, any>> {
    return this.command('nft_calculate_royalties', req);
  }
}

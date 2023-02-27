import CATToken, { type CATTokenStray } from '../@types/CATToken';
import type Transaction from '../@types/Transaction';
import Wallet from '../services/WalletService';

export default class CATWallet extends Wallet {
  async createNewCatWallet(args: { amount: string; fee: string }) {
    return super.createNewWallet({
      walletType: 'cat_wallet',
      options: {
        mode: 'new',
        ...args,
      },
    });
  }

  async createWalletForExisting(args: { assetId: string; fee: string }) {
    return super.createNewWallet({
      walletType: 'cat_wallet',
      options: {
        mode: 'existing',
        ...args,
      },
    });
  }

  async getWalletIdAndName(args: { assetId: string }) {
    return this.command<{
      walletId?: number;
      name: string;
    }>('cat_asset_id_to_name', args);
  }

  async getAssetId(args: { walletId: number }) {
    return this.command<{
      walletId: number;
      assetId: string;
    }>('cat_get_asset_id', args);
  }

  async getName(args: { walletId: number }) {
    return this.command<{
      walletId: number;
      name: string;
    }>('cat_get_name', args);
  }

  async setName(args: { walletId: number; name: string }) {
    return this.command<{
      walletId: number;
    }>('cat_set_name', args);
  }

  async spend(args: { walletId: number; innerAddress: string; amount: string; fee: string; memos?: string[] }) {
    return this.command<{
      transaction: Transaction;
      transactionId: string;
    }>('cat_spend', args);
  }

  async getCatList() {
    return this.command<{
      catList: CATToken[];
    }>('get_cat_list');
  }

  async getStrayCats() {
    return this.command<{
      strayCats: CATTokenStray[];
    }>('get_stray_cats');
  }
}

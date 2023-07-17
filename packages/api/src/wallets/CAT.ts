import type BigNumber from 'bignumber.js';

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

  async spend(args: { walletId: number; address: string; amount: string; fee: string; memos?: string[] }) {
    const { address, ...updatedArgs } = args;
    // cat_spend expects 'inner_address' instead of 'address'
    if (!(updatedArgs as any).innerAddress) {
      (updatedArgs as any).innerAddress = address;
    }

    return this.command<{
      transaction: Transaction;
      transactionId: string;
    }>('cat_spend', updatedArgs);
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

  async crCatApprovePending(args: {
    walletId: number;
    minAmountToClaim: number | BigNumber;
    fee: number | BigNumber;
    minCoinAmount?: number | BigNumber;
    maxCoinAmount?: number | BigNumber;
    excludedCoinAmounts?: Array<number | BigNumber>;
    reusePuzhash?: boolean;
  }) {
    return this.command<{
      transactions: Transaction[];
    }>('crcat_approve_pending', args);
  }
}

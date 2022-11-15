import Wallet from '../services/Wallet';

export default class CATWallet extends Wallet {
  async createNewWallet(amount: string, fee: string) {
    return super.createNewWallet('cat_wallet', {
      mode: 'new',
      amount,
      fee,
    });
  }

  async createWalletForExisting(assetId: string, fee: string) {
    return super.createNewWallet('cat_wallet', {
      mode: 'existing',
      assetId,
      fee,
    });
  }

  async getAssetId(walletId: number) {
    return this.command('cat_get_asset_id', {
      walletId,
    });
  }

  async getName(walletId: number) {
    return this.command('cat_get_name', {
      walletId,
    });
  }

  async setName(walletId: number, name: string) {
    return this.command('cat_set_name', {
      walletId,
      name,
    });
  }

  async spend(walletId: number, innerAddress: string, amount: string, fee: string, memos?: string[]) {
    return this.command('cat_spend', {
      walletId,
      innerAddress,
      amount,
      fee,
      memos,
    });
  }

  async getCatList() {
    return this.command('get_cat_list');
  }

  async getStrayCats() {
    return this.command('get_stray_cats');
  }
}

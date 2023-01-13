import Wallet from '../services/WalletService';

export default class RLWallet extends Wallet {
  async createAdminWallet(interval: string, limit: string, pubkey: string, amount: string) {
    return this.createNewWallet('rl_wallet', {
      rlType: 'admin',
      interval,
      limit,
      pubkey,
      amount,
    });
  }

  async createUserWallet() {
    return this.createNewWallet('rl_wallet', {
      rlType: 'user',
    });
  }

  async setUserInfo(walletId: number, interval: string, limit: string, origin: string, adminPubkey: string) {
    return this.command('rl_set_user_info', {
      walletId,
      interval,
      limit,
      origin,
      adminPubkey,
    });
  }
}

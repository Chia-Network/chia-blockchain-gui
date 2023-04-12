import Wallet from '../services/WalletService';

export default class RLWallet extends Wallet {
  async createAdminWallet(args: { interval: string; limit: string; pubkey: string; amount: string }) {
    return this.createNewWallet({
      walletType: 'rl_wallet',
      options: {
        rlType: 'admin',
        ...args,
      },
    });
  }

  async createUserWallet() {
    return this.createNewWallet({
      walletType: 'rl_wallet',
      options: {
        rlType: 'user',
      },
    });
  }
}

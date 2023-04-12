import Wallet from '../services/WalletService';

export default class PoolWallet extends Wallet {
  async createNewPoolWallet(args: { initialTargetState: Object; fee: string }) {
    return super.createNewWallet({
      walletType: 'pool_wallet',
      options: {
        mode: 'new',
        ...args,
      },
    });
  }
}

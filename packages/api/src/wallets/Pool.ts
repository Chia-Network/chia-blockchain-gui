import Wallet from '../services/WalletService';

export default class PoolWallet extends Wallet {
  async createNewWallet(initialTargetState: Object, fee: string) {
    return super.createNewWallet('pool_wallet', {
      mode: 'new',
      fee,
      initialTargetState,
    });
  }
}

import Wallet, { type AllowUnsyncedArg } from '../services/WalletService';

export default class PoolWallet extends Wallet {
  async createNewPoolWallet(args: { initialTargetState: Object; fee: string } & AllowUnsyncedArg) {
    const { allowUnsynced, ...opts } = args;
    return super.createNewWallet({
      walletType: 'pool_wallet',
      options: {
        mode: 'new',
        ...opts,
      },
      ...(allowUnsynced != null ? { allowUnsynced } : {}),
    });
  }
}

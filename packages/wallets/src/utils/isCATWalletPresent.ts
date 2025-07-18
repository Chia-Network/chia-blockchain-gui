import type { Wallet, CATToken } from '@chia-network/api';
import { WalletType } from '@chia-network/api';

export default function isCATWalletPresent(wallets: Wallet[], token: CATToken): boolean {
  return !!wallets?.find((wallet) => {
    if (
      [WalletType.CAT, WalletType.RCAT, WalletType.CRCAT].includes(wallet.type) &&
      wallet.meta?.assetId === token.assetId
    ) {
      return true;
    }

    return false;
  });
}

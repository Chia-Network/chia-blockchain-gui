import { store, walletApi } from '@chia-network/api-react';
import BigNumber from 'bignumber.js';

// The original content of the type comes from '@chia-network/src/services/wallet.ts'
export type WalletBalanceFormatted = {
  confirmedWalletBalance: number;
  maxSendAmount: number;
  pendingChange: number;
  pendingCoinRemovalCount: number;
  spendableBalance: number;
  unconfirmedWalletBalance: number;
  unspentCoinCount: number;
  walletId: number;
  pendingBalance: BigNumber;
  pendingTotalBalance: BigNumber;
};

export async function getBalance(walletId: number) {
  // Adding a cache subscription
  const resultPromise = store.dispatch(
    walletApi.endpoints.getWalletBalance.initiate({
      walletId,
    })
  );

  const result = await resultPromise;

  // Removing the corresponding cache subscription
  resultPromise.unsubscribe();

  if (result.error) {
    throw result.error;
  }

  const wb = result.data as WalletBalanceFormatted;
  if (!wb || !('spendableBalance' in wb)) {
    throw new Error('Wallet balance not found');
  }

  return wb;
}

export default async function hasSpendableBalance(walletId: number, amount: BigNumber) {
  const walletBalance = await getBalance(walletId);
  const spendableBalance = new BigNumber(walletBalance.spendableBalance);

  return spendableBalance.gte(amount);
}

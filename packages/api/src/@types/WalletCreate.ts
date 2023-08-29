import WalletType from '../constants/WalletType';

import type Transaction from './Transaction';

type WalletCreateCAT = {
  type: WalletType;
  assetId: string;
  walletId: number;
};

type WalletCreateDID = {
  type: WalletType;
  myDid: string;
  walletId: number;
};

type WalletCreateRecoveryDID = {
  type: WalletType;
  myDid: string;
  walletId: number;
  coinName: string;
  coinList: { parentCoinInfo: string; puzzleHash: string; amount: number };
  newpuzhash: string;
  pubkey: string;
  backupDids: string[];
  numVerificationsRequired: number;
};

export type WalletCreatePool = {
  totalFee: number;
  transaction: Transaction;
  launcherId: string;
  p2SingletonPuzzleHash: string;
};

type WalletCreateNFT = {
  type: WalletType;
  walletId: number;
};

type WalletCreate = WalletCreateCAT | WalletCreateDID | WalletCreateRecoveryDID | WalletCreatePool | WalletCreateNFT;

export default WalletCreate;

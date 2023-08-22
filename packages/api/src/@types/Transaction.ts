import type BigNumber from 'bignumber.js';

import type TransactionType from '../constants/TransactionType';

import type SpendBundle from './SpendBundle';

type AdditionsOrRemovals = {
  amount: number;
  parentCoinInfo: string;
  puzzleHash: string;
};
type Memo = string | string[];

type Transaction = {
  additions: AdditionsOrRemovals[];
  amount: number | BigNumber;
  confirmed: boolean;
  confirmedAtHeight: number;
  createdAtTime: number;
  feeAmount: number | BigNumber;
  memos: Memo[];
  name: string;
  removals: AdditionsOrRemovals[];
  sent: number | BigNumber;
  sentTo: string[];
  spendBundle: SpendBundle | null;
  toAddress: string;
  toPuzzleHash: string;
  tradeId: string | null;
  type: TransactionType;
  walletId: number;
  metadata?: {
    coinId: string;
    recipientPuzzleHash: string;
    senderPuzzleHash: string;
    timeLock: number;
    spent: boolean;
  };
};

export default Transaction;

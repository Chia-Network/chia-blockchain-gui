import { TransactionType, WalletType } from '@chia-network/api';
import type { Transaction } from '@chia-network/api';
import { useGetWalletBalanceQuery } from '@chia-network/api-react';
import {
  useLocale,
  mojoToChia,
  mojoToCAT,
  blockHeightToTimestamp,
  bigNumberToLocaleString,
  LineChart,
} from '@chia-network/core';
import BigNumber from 'bignumber.js';
import { orderBy, groupBy, map, sortBy } from 'lodash';
import moment from 'moment';
import React, { useCallback } from 'react';

import useWalletTransactions from '../hooks/useWalletTransactions';

function generateTransactionGraphData(transactions: Transaction[]): {
  value: BigNumber;
  timestamp: number;
}[] {
  // use only confirmed transactions
  const confirmedTransactions = transactions.filter((transaction) => transaction.confirmed);

  const [peakTransaction] = confirmedTransactions;

  // extract and compute values
  let results = confirmedTransactions.map<{
    value: BigNumber;
    timestamp: number;
  }>((transaction) => {
    const { type, confirmedAtHeight, amount, feeAmount } = transaction;

    const isOutgoing = [TransactionType.OUTGOING, TransactionType.OUTGOING_TRADE].includes(type);

    const total = new BigNumber(amount).plus(new BigNumber(feeAmount));
    const value = isOutgoing ? total.negated() : total;

    return {
      value,
      timestamp: blockHeightToTimestamp(confirmedAtHeight, peakTransaction),
    };
  });

  // group transactions by confirmed_at_height
  const groupedResults = groupBy(results, 'timestamp');

  // sum grouped transaction and extract just valuable information
  results = map(groupedResults, (items, timestamp) => {
    const values = items.map((item) => item.value);

    return {
      timestamp: Number(timestamp),
      value: BigNumber.sum(...values),
    };
  });

  // order by timestamp
  results = orderBy(results, ['timestamp'], ['desc']);

  if (results.length === 1) {
    results.push({ timestamp: 0, value: new BigNumber(0) });
  }

  return results;
}

function prepareGraphPoints(
  balance: number,
  transactions: Transaction[],
): {
  x: number;
  y: BigNumber;
}[] {
  if (!transactions || !transactions.length) {
    return [];
  }

  let start = new BigNumber(balance);

  const data = generateTransactionGraphData(transactions);
  const [peakTransaction] = transactions;

  const points = [
    {
      x: blockHeightToTimestamp(peakTransaction.confirmedAtHeight, peakTransaction),
      y: BigNumber.max(0, start),
    },
  ];

  data.forEach((item) => {
    const { timestamp, value } = item;

    start = start.minus(value);

    const isAlreadyUsed = points.some((point) => point.x === timestamp);
    if (isAlreadyUsed) {
      return;
    }

    points.push({
      x: timestamp,
      y: BigNumber.max(0, start),
    });
  });

  return sortBy(points, (point) => point.x);
}

export type WalletGraphProps = {
  walletId: number;
  walletType: WalletType;
  unit?: string;
  height?: number;
};

export default function WalletGraph(props: WalletGraphProps) {
  const { walletId, walletType, unit = '', height = 150 } = props;
  const [locale] = useLocale();
  const { transactions, isLoading: isWalletTransactionsLoading } = useWalletTransactions({
    walletId,
    defaultRowsPerPage: 50,
    defaultPage: 0,
    sortKey: 'RELEVANCE',
    typeFilter: {
      mode: 2,
      values: [TransactionType.INCOMING_CLAWBACK_RECEIVE, TransactionType.INCOMING_CLAWBACK_SEND],
    },
  });
  const { data: walletBalance, isLoading: isWalletBalanceLoading } = useGetWalletBalanceQuery({
    walletId,
  });

  const isCAT = [WalletType.CAT, WalletType.CRCAT].includes(walletType);
  const isLoading = isWalletTransactionsLoading || isWalletBalanceLoading || !transactions;

  const confirmedTransactions = transactions ? transactions.filter((transaction) => transaction.confirmed) : [];

  const balance = walletBalance?.confirmedWalletBalance || 0;

  const data = prepareGraphPoints(balance, confirmedTransactions);

  const xValueFormatter = useCallback((value: number) => moment(value * 1000).format('LLL'), []);

  const yValueFormatter = useCallback(
    (value: number) => {
      const formattedValue = isCAT ? mojoToCAT(value) : mojoToChia(value);

      return `${bigNumberToLocaleString(formattedValue, locale)} ${unit}`;
    },
    [isCAT, unit, locale],
  );

  if (isLoading || !walletBalance || !confirmedTransactions.length) {
    return null;
  }

  return (
    <LineChart
      data={data}
      height={height}
      // min={0}
      xValueFormatter={xValueFormatter}
      yValueFormatter={yValueFormatter}
    />
  );
}

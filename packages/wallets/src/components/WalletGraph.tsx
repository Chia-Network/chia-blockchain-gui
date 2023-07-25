import { TransactionType, WalletType } from '@chia-network/api';
import type { Transaction } from '@chia-network/api';
import { useGetWalletBalanceQuery } from '@chia-network/api-react';
import { Color, mojoToChia, mojoToCAT, blockHeightToTimestamp } from '@chia-network/core';
import { alpha } from '@mui/material';
import BigNumber from 'bignumber.js';
import { orderBy, groupBy, map } from 'lodash';
import React, { ReactNode } from 'react';
import { useMeasure } from 'react-use';
import styled from 'styled-components';
import { VictoryChart, VictoryAxis, VictoryArea, VictoryTooltip, VictoryVoronoiContainer } from 'victory';

import useWalletTransactions from '../hooks/useWalletTransactions';
import WalletGraphTooltip from './WalletGraphTooltip';

const StyledGraphContainer = styled.div`
  position: relative;
  min-height: 80px;
  height: ${({ height }) => (typeof height === 'string' ? height : `${height}px`)};
`;

type Aggregate = {
  interval: number; // interval second
  count: number; // number of intervals
  offset?: number;
};

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
  walletType: WalletType,
  _aggregate?: Aggregate
): {
  x: number;
  y: number;
  tooltip?: ReactNode;
}[] {
  if (!transactions || !transactions.length) {
    return [];
  }

  let start = balance;
  const data = generateTransactionGraphData(transactions);

  const [peakTransaction] = transactions;

  /*
  if (aggregate) {
    const { interval, count, offset } = aggregate;
    data = aggregatePoints(data, interval, count, offset);
  }
  */

  const points = [
    {
      x: blockHeightToTimestamp(peakTransaction.confirmedAtHeight, peakTransaction),
      y: BigNumber.max(0, (walletType === WalletType.CAT ? mojoToCAT(start) : mojoToChia(start)).toNumber()), // max 21,000,000 safe to number
      tooltip: (walletType === WalletType.CAT ? mojoToCAT(balance) : mojoToChia(balance)).toString(), // bignumber is not supported by react
    },
  ];

  data.forEach((item) => {
    const { timestamp, value } = item;

    start -= value.toNumber();

    const isAlreadyUsed = points.some((point) => point.x === timestamp);
    if (isAlreadyUsed) {
      return;
    }

    points.push({
      x: timestamp,
      y: BigNumber.max(0, (walletType === WalletType.CAT ? mojoToCAT(start) : mojoToChia(start)).toNumber()), // max 21,000,000 safe to number
      tooltip: walletType === WalletType.CAT ? mojoToCAT(start) : mojoToChia(start).toString(), // bignumber is not supported by react
    });
  });

  return points.reverse();
}

function LinearGradient() {
  return (
    <linearGradient id="graph-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={alpha(Color.Green[500], 0.4)} />
      <stop offset="100%" stopColor={alpha(Color.Green[500], 0)} />
    </linearGradient>
  );
}

export type WalletGraphProps = {
  walletId: number;
  walletType: WalletType;
  unit?: string;
  height?: number | string;
};

export default function WalletGraph(props: WalletGraphProps) {
  const { walletId, walletType, unit = '', height = 150 } = props;
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

  const [ref, containerSize] = useMeasure();

  const isLoading = isWalletTransactionsLoading || isWalletBalanceLoading || !transactions;
  if (isLoading || !walletBalance) {
    return null;
  }

  const confirmedTransactions = transactions.filter((transaction) => transaction.confirmed);
  if (!confirmedTransactions.length) {
    return null;
  }

  const balance = walletBalance.confirmedWalletBalance;

  const data = prepareGraphPoints(balance, confirmedTransactions, walletType, {
    interval: 60 * 60,
    count: 24,
    offset: 0,
  });

  const min = data.length ? Math.min(...data.map((item) => item.y)) : 0;
  const max = Math.max(min, ...data.map((item) => item.y));

  return (
    <StyledGraphContainer height={height} ref={ref}>
      <VictoryChart
        animate={{ duration: 300, onLoad: { duration: 0 } }}
        width={containerSize.width || 1}
        height={containerSize.height || 1}
        domain={{ y: [0, max] }}
        padding={0}
        domainPadding={{ x: 0, y: 1 }}
        containerComponent={<VictoryVoronoiContainer />}
      >
        <VictoryArea
          data={data}
          interpolation="monotoneX"
          style={{
            data: {
              stroke: Color.Green[500],
              strokeWidth: 2,
              strokeLinecap: 'round',
              fill: 'url(#graph-gradient)',
            },
          }}
          labels={() => ''}
          labelComponent={<VictoryTooltip flyoutComponent={<WalletGraphTooltip suffix={unit} />} />}
        />
        <VictoryAxis
          style={{
            axis: { stroke: 'transparent' },
            ticks: { stroke: 'transparent' },
            tickLabels: { fill: 'transparent' },
          }}
        />
        <LinearGradient />
      </VictoryChart>
    </StyledGraphContainer>
  );
}

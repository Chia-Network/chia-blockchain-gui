import type { Transaction } from '@chia-network/api';
import { useGetTransactionsQuery, useGetTransactionsCountQuery } from '@chia-network/api-react';
import { useState } from 'react';

type UseWalletTransactionsArgs = {
  walletId: number;
  defaultRowsPerPage: number;
  defaultPage: number;
  sortKey?: 'CONFIRMED_AT_HEIGHT' | 'RELEVANCE';
  reverse?: boolean;
  confirmed?: boolean;
  typeFilter?: {
    mode: number;
    values: number[];
  };
};

export default function useWalletTransactions(args: UseWalletTransactionsArgs): {
  isLoading: boolean;
  transactions?: Transaction[];
  count?: number;
  error?: Error;
  page: number;
  rowsPerPage: number;
  pageChange: (rowsPerPage: number, page: number) => void;
} {
  const { walletId, defaultRowsPerPage = 10, defaultPage = 0, sortKey, reverse, confirmed, typeFilter } = args;

  const [rowsPerPage, setRowsPerPage] = useState<number>(defaultRowsPerPage);
  const [page, setPage] = useState<number>(defaultPage);

  const {
    data: count,
    isLoading: isTransactionsCountLoading,
    error: transactionsCountError,
  } = useGetTransactionsCountQuery({
    walletId,
    typeFilter,
    confirmed,
  });

  const all = rowsPerPage === -1;

  const start = all ? 0 : page * rowsPerPage;

  const end = all ? count ?? 0 : start + rowsPerPage;

  const {
    data: transactions,
    isLoading: isTransactionsLoading,
    error: transactionsError,
  } = useGetTransactionsQuery(
    {
      walletId,
      start,
      end,
      sortKey,
      reverse,
      confirmed,
      typeFilter,
    },
    {
      skipToken: count === undefined,
    }
  );

  const isLoading = isTransactionsLoading || isTransactionsCountLoading;
  const error = transactionsError || transactionsCountError;

  // TODO move sorting to the backend
  const transactionsOrdered = transactions;

  function handlePageChange(rowsPerPageLocal: number, pageLocal: number) {
    setRowsPerPage(rowsPerPageLocal);
    setPage(pageLocal);
  }

  return {
    transactions: transactionsOrdered,
    count,
    page,
    rowsPerPage,
    isLoading,
    error,
    pageChange: handlePageChange,
  };
}

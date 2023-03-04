import { OfferCoinOfInterest, OfferSummaryRecord } from '@chia-network/api';
import { useGetOffersCountQuery, useGetAllOffersQuery } from '@chia-network/api-react';
import { useState, useCallback } from 'react';

export type OfferTradeRecordFormatted = {
  confirmedAtIndex: number;
  acceptedAtTime: number;
  createdAtTime: number;
  isMyOffer: boolean;
  pending: Record<string, number>;
  sent: number;
  coinsOfInterest: OfferCoinOfInterest[];
  tradeId: string;
  status: string;
  sentTo: any[];
  summary: OfferSummaryRecord;
  offerData?: string;
};

export default function useWalletOffers(
  defaultRowsPerPage = 5,
  defaultPage = 0,
  includeMyOffers = true,
  includeTakenOffers = true,
  sortKey?: 'CONFIRMED_AT_HEIGHT' | 'RELEVANCE',
  reverse?: boolean
): {
  isLoading: boolean;
  offers?: OfferTradeRecordFormatted[];
  count?: number;
  error?: Error;
  page: number;
  rowsPerPage: number;
  pageChange: (rowsPerPage: number, page: number) => void;
} {
  const [rowsPerPage, setRowsPerPage] = useState<number>(defaultRowsPerPage);
  const [page, setPage] = useState<number>(defaultPage);

  const { data: counts, isLoading: isOffersCountLoading, error: offersCountError } = useGetOffersCountQuery();

  const all = rowsPerPage === -1;

  const start = all ? 0 : page * rowsPerPage;

  let selectedCount = 0;

  if (includeMyOffers) {
    selectedCount += counts?.myOffersCount ?? 0;
  }

  if (includeTakenOffers) {
    selectedCount += counts?.takenOffersCount ?? 0;
  }

  const end = all ? selectedCount : start + rowsPerPage;

  const {
    data: offers,
    isLoading: isOffersLoading,
    error: offersError,
  } = useGetAllOffersQuery({
    start,
    end,
    sortKey,
    reverse,
    includeMyOffers,
    includeTakenOffers,
  });

  const isLoading = isOffersLoading || isOffersCountLoading;
  const error = offersError || offersCountError;

  const handlePageChange = useCallback(
    (rowsPerPageLocal: number, pageLocal: number) => {
      setRowsPerPage(rowsPerPageLocal);
      setPage(pageLocal);
    },
    [setRowsPerPage, setPage]
  );

  return {
    offers,
    count: selectedCount,
    page,
    rowsPerPage,
    isLoading,
    error,
    pageChange: handlePageChange,
  };
}

import { OfferTradeRecord } from '@chia-network/api';
import { useGetOffersCountQuery, useGetAllOffersQuery, useGetNFTsByNFTIDsQuery } from '@chia-network/api-react';
import { t } from '@lingui/macro';
import { useState, useRef } from 'react';

import resolveOfferInfo from '../util/resolveOfferInfo';
import useAllowFilteredShow from './useAllowFilteredShow';
import useAssetIdName from './useAssetIdName';

export default function useWalletOffers(
  defaultRowsPerPage = 5,
  defaultPage = 0,
  includeMyOffers = true,
  includeTakenOffers = true,
  sortKey?: 'CONFIRMED_AT_HEIGHT' | 'RELEVANCE',
  reverse?: boolean
): {
  isLoading: boolean;
  offers?: OfferTradeRecord[];
  count?: number;
  error?: Error;
  page: number;
  rowsPerPage: number;
  pageChange: (rowsPerPage: number, page: number) => void;
} {
  const [rowsPerPage, setRowsPerPage] = useState<number>(defaultRowsPerPage);
  const [page, setPage] = useState<number>(defaultPage);
  const { lookupByAssetId } = useAssetIdName();

  function getNFTidFromOffer(offer: any) {
    const resolveArray = resolveOfferInfo(offer.summary, 'infos', lookupByAssetId);
    if (resolveArray.length > 0) {
      return resolveArray[0].displayName;
    }
    return '';
  }

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

  const metadataObj = useRef<any>({});
  const nftIds =
    offers && offers.length
      ? offers.map((offer: any) => getNFTidFromOffer(offer)).filter((nftId: string) => !!nftId)
      : [];
  const { data: requestedNFTs } = useGetNFTsByNFTIDsQuery({ nftIds }, { skip: nftIds.length === 0 });
  const { allowNFTsFiltered } = useAllowFilteredShow(requestedNFTs || [], false, requestedNFTs?.length === 0, true);
  allowNFTsFiltered.forEach((nft) => {
    metadataObj.current[nft.$nftId] = nft?.metadata?.name || t`Title not available`;
  });

  const isLoading = isOffersLoading || isOffersCountLoading;
  const error = offersError || offersCountError;

  function handlePageChange(rowsPerPageLocal: number, pageLocal: number) {
    setRowsPerPage(rowsPerPageLocal);
    setPage(pageLocal);
  }

  return {
    offers: offers
      ? offers.map((offer: any) => ({ ...offer, name: metadataObj.current[getNFTidFromOffer(offer)] }))
      : [],
    count: selectedCount,
    page,
    rowsPerPage,
    isLoading,
    error,
    pageChange: handlePageChange,
  };
}

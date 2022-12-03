import { useGetLoggedInFingerprintQuery, useGetPlottersQuery } from '@chia-network/api-react';
import { useCurrencyCode, Suspender } from '@chia-network/core';
import React from 'react';

import useUnconfirmedPlotNFTs from '../../../hooks/useUnconfirmedPlotNFTs';
import PlotAddForm from './PlotAddForm';

export default function PlotAdd() {
  const currencyCode = useCurrencyCode();
  const { isLoading: isLoadingUnconfirmedPlotNFTs } = useUnconfirmedPlotNFTs();
  const { data: fingerprint, isLoading: isLoadingFingerprint } = useGetLoggedInFingerprintQuery();
  const { data: plotters, isLoading: isLoadingPlotters } = useGetPlottersQuery();

  const isLoading = isLoadingFingerprint || isLoadingPlotters || !currencyCode || isLoadingUnconfirmedPlotNFTs;

  if (isLoading) {
    return <Suspender />;
  }

  return <PlotAddForm currencyCode={currencyCode} fingerprint={fingerprint} plotters={plotters} />;
}

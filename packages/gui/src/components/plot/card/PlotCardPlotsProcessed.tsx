import React from 'react';
import { Trans } from '@lingui/macro';
import { FormatLargeNumber, CardSimple } from '@chia/core';
import { useGetTotalHarvestersSummaryQuery } from '@chia/api-react';

export default function PlotCardPlotsProcessed() {
  const { plotsProcessed, isLoading } = useGetTotalHarvestersSummaryQuery();

  return (
    <CardSimple
      title={<Trans>Plots Processed</Trans>}
      value={<FormatLargeNumber value={plotsProcessed} />}
      loading={isLoading}
    />
  );
}

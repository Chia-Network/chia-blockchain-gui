import { useGetTotalHarvestersSummaryQuery } from '@chia/api-react';
import { FormatBytes, CardSimple } from '@chia/core';
import { Trans } from '@lingui/macro';
import React from 'react';

export default function PlotCardTotalPlotsSize() {
  const { totalPlotSize, initializedHarvesters, isLoading } = useGetTotalHarvestersSummaryQuery();

  return (
    <CardSimple
      title={<Trans>Total Plots Size</Trans>}
      value={<FormatBytes value={totalPlotSize} precision={3} />}
      loading={isLoading || !initializedHarvesters}
    />
  );
}

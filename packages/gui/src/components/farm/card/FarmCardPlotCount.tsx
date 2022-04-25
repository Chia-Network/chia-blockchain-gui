import React from 'react';
import { Trans } from '@lingui/macro';
import { FormatLargeNumber, CardSimple } from '@chia/core';
import { useGetTotalHarvestersSummaryQuery } from '@chia/api-react';

export default function FarmCardPlotCount() {
  const { uniquePlots, isLoading } = useGetTotalHarvestersSummaryQuery();

  return (
    <CardSimple
      title={<Trans>Plot Count</Trans>}
      value={'N/A'/*<FormatLargeNumber value={uniquePlots?.length} />*/}
      loading={isLoading}
    />
  );
}

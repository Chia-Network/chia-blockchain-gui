import React from 'react';
import { Trans } from '@lingui/macro';
import { FormatLargeNumber, CardSimple } from '@chia/core';
import { useGetTotalHarvestersSummaryQuery } from '@chia/api-react';

export default function PlotCardNotFound() {
  const { noKeyFilenames, isLoading } = useGetTotalHarvestersSummaryQuery();

  return (
    <CardSimple
      title={<Trans>Plots Not Found</Trans>}
      value={<FormatLargeNumber value={noKeyFilenames} />}
      loading={isLoading}
    />
  );
}

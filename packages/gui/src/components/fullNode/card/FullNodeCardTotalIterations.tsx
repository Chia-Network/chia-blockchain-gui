import { useGetBlockchainStateQuery } from '@chia/api-react';
import { FormatLargeNumber, CardSimple } from '@chia/core';
import { Trans } from '@lingui/macro';
import React from 'react';

export default function FullNodeCardTotalIterations() {
  const { data, isLoading, error } = useGetBlockchainStateQuery();
  const value = data?.peak?.totalIters ?? 0;

  return (
    <CardSimple
      loading={isLoading}
      valueColor="textPrimary"
      title={<Trans>Total Iterations</Trans>}
      tooltip={
        <Trans>Total iterations since the start of the blockchain</Trans>
      }
      value={<FormatLargeNumber value={value} />}
      error={error}
    />
  );
}

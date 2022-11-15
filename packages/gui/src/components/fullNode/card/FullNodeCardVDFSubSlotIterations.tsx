import { useGetBlockchainStateQuery } from '@chia/api-react';
import { FormatLargeNumber, CardSimple } from '@chia/core';
import { Trans } from '@lingui/macro';
import React from 'react';

export default function FullNodeCardVDFSubSlotIterations() {
  const { data, isLoading, error } = useGetBlockchainStateQuery();
  const value = data?.peak?.subSlotIters ?? 0;

  return (
    <CardSimple
      loading={isLoading}
      valueColor="textPrimary"
      title={<Trans>VDF Sub Slot Iterations</Trans>}
      value={<FormatLargeNumber value={value} />}
      error={error}
    />
  );
}

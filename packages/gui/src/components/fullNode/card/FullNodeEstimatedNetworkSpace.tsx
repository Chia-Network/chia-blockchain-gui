import { useGetBlockchainStateQuery } from '@chia-network/api-react';
import { FormatBytes, CardSimple } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import React from 'react';

export default function FullNodeEstimatedNetworkSpace() {
  const { data, isLoading, error } = useGetBlockchainStateQuery();
  const value = data?.space;

  return (
    <CardSimple
      loading={isLoading}
      valueColor="textPrimary"
      title={<Trans>Estimated Network Space</Trans>}
      tooltip={<Trans>Estimated sum of all the plotted disk space of all farmers in the network</Trans>}
      value={value && <FormatBytes value={value} precision={3} />}
      error={error}
    />
  );
}

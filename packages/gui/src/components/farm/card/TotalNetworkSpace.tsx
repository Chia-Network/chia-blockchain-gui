import { useGetBlockchainStateQuery } from '@chia-network/api-react';
import { FormatBytes, CardSimple } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import React from 'react';

export default React.memo(TotalNetworkSpace);
function TotalNetworkSpace() {
  const { data, isLoading, error } = useGetBlockchainStateQuery();
  const totalNetworkSpace = data?.space ?? 0;

  return (
    <CardSimple
      title={<Trans>Total Netspace</Trans>}
      value={<FormatBytes value={totalNetworkSpace} precision={3} />}
      loading={isLoading}
      tooltip={<Trans>Best estimate over last 24 hours</Trans>}
      error={error}
    />
  );
}

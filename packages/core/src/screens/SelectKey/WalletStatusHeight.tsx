import { useGetHeightInfoQuery } from '@chia-network/api-react';
import React from 'react';

import FormatLargeNumber from '../../components/FormatLargeNumber';

export default function WalletStatusHeight() {
  const { data: heightData, isLoading } = useGetHeightInfoQuery(
    {},
    {
      pollingInterval: 10_000,
    },
  );
  const height = heightData?.height;

  if (isLoading) {
    return null;
  }

  if (height === undefined || height === null) {
    return null;
  }

  return (
    <>
      (
      <FormatLargeNumber value={height} />)
    </>
  );
}

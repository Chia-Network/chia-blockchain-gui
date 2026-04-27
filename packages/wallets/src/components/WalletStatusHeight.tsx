import { useGetHeightInfoQuery } from '@chia-network/api-react';
import { FormatLargeNumber } from '@chia-network/core';
import React from 'react';

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

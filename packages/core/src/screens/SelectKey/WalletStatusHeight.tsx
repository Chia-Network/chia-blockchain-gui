import { useGetWalletHeightInfoQuery } from '@chia-network/api-react';
import React from 'react';

import FormatLargeNumber from '../../components/FormatLargeNumber';

export default function WalletStatusHeight() {
  const { data: heightInfo, isLoading } = useGetWalletHeightInfoQuery({
    pollingInterval: 10_000,
  });

  if (isLoading) {
    return null;
  }

  if (heightInfo === undefined || heightInfo === null) {
    return null;
  }

  return (
    <>
      (
      <FormatLargeNumber value={heightInfo.height} />)
    </>
  );
}

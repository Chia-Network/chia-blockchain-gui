import { useGetWalletBalanceQuery } from '@chia-network/api-react';
import { CardSimple } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import React, { ReactElement } from 'react';

import useWallet from '../../hooks/useWallet';
import useWalletHumanValue from '../../hooks/useWalletHumanValue';

type Props = {
  walletId: number;
  tooltip?: ReactElement<any>;
};

export default function WalletCardPendingTotalBalance(props: Props) {
  const { walletId, tooltip } = props;

  const {
    data: walletBalance,
    isLoading: isLoadingWalletBalance,
    error,
  } = useGetWalletBalanceQuery(
    {
      walletId,
    },
    {
      pollingInterval: 10_000,
    }
  );

  const { wallet, unit = '', loading } = useWallet(walletId);

  const isLoading = loading || isLoadingWalletBalance;
  const value = walletBalance?.pendingTotalBalance;

  const humanValue = useWalletHumanValue(wallet, value, unit);

  return (
    <CardSimple
      loading={isLoading}
      valueColor="secondary"
      title={<Trans>Pending Total Balance</Trans>}
      tooltip={tooltip}
      value={humanValue}
      error={error}
    />
  );
}

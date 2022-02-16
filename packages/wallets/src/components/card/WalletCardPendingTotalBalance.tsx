import React, { useMemo, ReactElement } from 'react';
import { Trans } from '@lingui/macro';
import { useGetWalletBalanceQuery } from '@chia/api-react';
import { Card, Grid, Box, Flex, CardSimple, TooltipIcon, Loading } from '@chia/core';
import { Typography } from '@material-ui/core';
import useWallet from '../../hooks/useWallet';
import getWalletHumanValue from '../../utils/getWalletHumanValue';



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
  } = useGetWalletBalanceQuery({
    walletId,
  });

  const { wallet, unit = '', loading } = useWallet(walletId);

  const isLoading = loading || isLoadingWalletBalance;
  const value = walletBalance?.pendingTotalBalance;

  const humanValue = useMemo(() => wallet && value !== undefined
      ? `${getWalletHumanValue(wallet, value)}`
      : ''
  ,[value, wallet, unit]);

  console.log("yes")

  return (
    <Card
      title={<Trans>Balance</Trans>}
      tooltip={tooltip}
    >
      {isLoading ? (
        <Loading center />
      ) : error ? (
        <Flex alignItems="center">
          <Trans><Typography variant="subtitle1" color="error">Error</Typography></Trans>
          &nbsp;
          <TooltipIcon>{error?.message}</TooltipIcon>
        </Flex>
      ) : (
        <div style={{display:"flex", alignItems:"baseline", gap:"4px"}}>
          <Trans>
          <Typography variant="h5" style={{ fontWeight: 500 }} color="textPrimary">{humanValue}</Typography>
          <Typography variant="h7" color="textSecondary">{unit}</Typography>
          </Trans>
        </div>
      )}
    </Card>
  );
}

/*
<CardSimple
  loading={isLoading}
  valueColor="secondary"
  title={<Trans>Pending Total Balance</Trans>}
  tooltip={tooltip}
  value={humanValue}
  error={error}
/>
*/

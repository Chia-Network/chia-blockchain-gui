import { useGetWalletsQuery } from '@chia-network/api-react';
import { CardSimple } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import React, { useMemo } from 'react';

import CrCatAuthorizedProviders from '../crCat/CrCatAuthorizedProviders';
import CRCatFlags from '../crCat/CrCatFlags';

type Props = {
  walletId: number;
};

export default function WalletCardCRCatRestrictions(props: Props) {
  const { walletId } = props;

  const { data: wallets, isLoading: isGetWalletsLoading } = useGetWalletsQuery(
    { includeData: true },
    {
      pollingInterval: 10_000,
    },
  );

  const restrictions = useMemo(() => {
    if (isGetWalletsLoading || !wallets) {
      return undefined;
    }

    const wallet = wallets.find((item) => item.id === walletId);
    if (!wallet) {
      return undefined;
    }
    return {
      authorizedProviders: wallet.authorizedProviders || [],
      flags: wallet.flagsNeeded || [],
    };
  }, [isGetWalletsLoading, walletId, wallets]);

  return (
    <CardSimple loading={isGetWalletsLoading} valueColor="secondary" title={<Trans>CAT credential restrictions</Trans>}>
      <Box>
        <CRCatFlags restrictions={restrictions} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          <Trans>Authorized providers</Trans>
        </Typography>
        <CrCatAuthorizedProviders authorizedProviders={restrictions?.authorizedProviders} />
      </Box>
    </CardSimple>
  );
}

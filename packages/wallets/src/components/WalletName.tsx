import { WalletType } from '@chia-network/api';
import { Flex, TooltipIcon } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Chip, Typography, type TypographyProps } from '@mui/material';
import React from 'react';

import useWallet from '../hooks/useWallet';
import getWalletPrimaryTitle from '../utils/getWalletPrimaryTitle';

export type WalletNameProps = TypographyProps & {
  walletId: number;
};

export default function WalletName(props: WalletNameProps) {
  const { walletId, ...rest } = props;
  const { wallet, loading } = useWallet(walletId);

  if (loading || !wallet) {
    return null;
  }

  const isRCAT = wallet.type === WalletType.RCAT;

  const primaryTitle = getWalletPrimaryTitle(wallet);

  return (
    <Typography {...rest} alignItems="center">
      {primaryTitle}
      {isRCAT && (
        <>
          &nbsp; &nbsp;
          <Chip
            label={
              <Flex alignItems="center" gap={1}>
                <Trans>Revocable</Trans>
                <TooltipIcon>
                  <Trans>This token can be revoked by the issuer</Trans>
                </TooltipIcon>
              </Flex>
            }
            variant="outlined"
            size="small"
          />
        </>
      )}
    </Typography>
  );
}

import type { Wallet } from '@chia-network/api';
import { useGetWalletsQuery } from '@chia-network/api-react';
import { Flex } from '@chia-network/core';
import { CrCatFlags, CrCatAuthorizedProviders } from '@chia-network/wallets';
import { Trans } from '@lingui/macro';
import { Grid, Typography } from '@mui/material';
import React from 'react';
import { useWatch } from 'react-hook-form';

import OfferBuilderAmountWithRoyalties from './OfferBuilderAmountWithRoyalties';
import OfferBuilderValue from './OfferBuilderValue';
import OfferBuilderWalletAmount from './OfferBuilderWalletAmount';

export type OfferBuilderTokenProps = {
  name: string;
  onRemove?: () => void;
  usedAssets?: string[];
  hideBalance?: boolean;
  amountWithRoyalties?: string;
  royaltyPayments?: Record<string, any>[];
};

export default function OfferBuilderToken(props: OfferBuilderTokenProps) {
  const { name, onRemove, usedAssets, hideBalance, amountWithRoyalties, royaltyPayments } = props;

  const valueObj = useWatch({
    name,
  });

  const { assetId, amount, crCat } = valueObj;

  const { data: wallets } = useGetWalletsQuery();
  const wallet = wallets?.find((walletItem: Wallet) => walletItem.meta?.assetId?.toLowerCase() === assetId);
  const warnUnknownCAT = assetId && !wallet;

  return (
    <Flex flexDirection="column" gap={2}>
      <Grid spacing={3} container>
        <Grid xs={12} md={5} item>
          <OfferBuilderWalletAmount
            name={`${name}.amount`}
            walletId={wallet?.id}
            showAmountInMojos={false}
            hideBalance={hideBalance}
          />
        </Grid>
        <Grid xs={12} md={7} item>
          <OfferBuilderValue
            name={`${name}.assetId`}
            type="token"
            label={<Trans>Asset Type</Trans>}
            usedAssets={usedAssets}
            onRemove={onRemove}
            warnUnknownCAT={warnUnknownCAT}
          />
          {crCat && (
            <Flex gap={1} flexDirection="column" sx={{ mt: 2 }}>
              <Typography variant="body1">
                <Trans>CAT credential restrictions</Trans>:
              </Typography>
              <CrCatFlags restrictions={crCat} />
              <Typography variant="body1">
                <Trans>Authorized providers</Trans>:
              </Typography>
              <CrCatAuthorizedProviders authorizedProviders={crCat.authorizedProviders} />
            </Flex>
          )}
        </Grid>
      </Grid>
      {royaltyPayments && amountWithRoyalties && (
        <OfferBuilderAmountWithRoyalties
          originalAmount={amount}
          totalAmount={amountWithRoyalties}
          royaltyPayments={royaltyPayments}
        />
      )}
    </Flex>
  );
}

import React from 'react';
import { Trans } from '@lingui/macro';
import { Grid } from '@mui/material';
import type { Wallet } from '@chia/api';
import { useGetWalletsQuery } from '@chia/api-react';
import { Flex, Tooltip } from '@chia/core';
import { useWatch } from 'react-hook-form';
import OfferBuilderRoyaltyPayouts from './OfferBuilderRoyaltyPayouts';
import OfferBuilderValue from './OfferBuilderValue';
import OfferBuilderWalletAmount from './OfferBuilderWalletAmount';
import { Typography } from '@mui/material';

export type OfferBuilderTokenProps = {
  name: string;
  onRemove?: () => void;
  usedAssets?: string[];
  hideBalance?: boolean;
  amountWithRoyalties?: string;
  royaltyPayments?: Record<string, any>[];
};

export default function OfferBuilderToken(props: OfferBuilderTokenProps) {
  const {
    name,
    onRemove,
    usedAssets,
    hideBalance,
    amountWithRoyalties,
    royaltyPayments,
  } = props;

  const assetIdFieldName = `${name}.assetId`;
  const assetId = useWatch({
    name: assetIdFieldName,
  });
  const value = useWatch({
    name: `${name}.amount`,
  });

  const { data: wallets } = useGetWalletsQuery();
  const wallet = wallets?.find(
    (wallet: Wallet) => wallet.meta?.assetId?.toLowerCase() === assetId,
  );
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
            name={assetIdFieldName}
            type="token"
            label={<Trans>Asset Type</Trans>}
            usedAssets={usedAssets}
            onRemove={onRemove}
            warnUnknownCAT={warnUnknownCAT}
          />
        </Grid>
      </Grid>
      {royaltyPayments && amountWithRoyalties && (
        <Flex flexDirection="column" gap={1}>
          <Typography variant="h6" color="textSecondary">
            <Trans>Total Amount with Royalties</Trans>
          </Typography>
          <Tooltip
            title={
              <OfferBuilderRoyaltyPayouts
                totalAmount={amountWithRoyalties}
                originalAmount={value}
                royaltyPayments={royaltyPayments}
              />
            }
          >
            <Typography variant="h6" noWrap>
              {amountWithRoyalties}
            </Typography>
          </Tooltip>
        </Flex>
      )}
    </Flex>
  );
}

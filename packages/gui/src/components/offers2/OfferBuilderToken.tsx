import React from 'react';
import { Trans } from '@lingui/macro';
import { Grid } from '@mui/material';
import type { Wallet } from '@chia/api';
import { useGetWalletsQuery } from '@chia/api-react';
import { useWatch } from 'react-hook-form';
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

  const { data: wallets } = useGetWalletsQuery();
  const wallet = wallets?.find(
    (wallet: Wallet) => wallet.meta?.assetId?.toLowerCase() === assetId,
  );
  const warnUnknownCAT = assetId && !wallet;

  return (
    <Grid spacing={3} container>
      <Grid xs={12} md={5} item>
        <OfferBuilderWalletAmount
          name={`${name}.amount`}
          walletId={wallet?.id}
          showAmountInMojos={false}
          hideBalance={hideBalance}
          amountWithRoyalties={amountWithRoyalties}
          royaltyPayments={royaltyPayments}
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
  );
}

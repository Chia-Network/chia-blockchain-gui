import React from 'react';
import { Trans } from '@lingui/macro';
import { useWallet } from '@chia/wallets';
import OfferBuilderValue from './OfferBuilderValue';
import OfferBuilderWalletBalance from './OfferBuilderWalletBalance';

export type OfferBuilderWalletAmountProps = {
  name: string;
  walletId: number;
  label?: ReactNode;
  onRemove?: () => void;
  showAmountInMojos?: boolean;
  hideBalance?: boolean;
  amountWithRoyalties?: string;
  royaltyPayments?: Record<string, any>[];
};

export default function OfferBuilderWalletAmount(
  props: OfferBuilderWalletAmountProps,
) {
  const {
    walletId,
    name,
    onRemove,
    showAmountInMojos,
    hideBalance = false,
    label,
    amountWithRoyalties,
    royaltyPayments,
  } = props;

  const { unit = '' } = useWallet(walletId);

  return (
    <OfferBuilderValue
      name={name}
      label={
        label ??
        (amountWithRoyalties ? (
          <Trans>Total Amount</Trans>
        ) : (
          <Trans>Amount</Trans>
        ))
      }
      type="amount"
      symbol={unit}
      showAmountInMojos={showAmountInMojos}
      caption={
        walletId !== undefined &&
        !hideBalance && <OfferBuilderWalletBalance walletId={walletId} />
      }
      onRemove={onRemove}
      amountWithRoyalties={amountWithRoyalties}
      royaltyPayments={royaltyPayments}
    />
  );
}

import { MojoToCAT } from '@chia-network/core';
import { t } from '@lingui/macro';
import React from 'react';

import WalletConnectCommandParamName from '../../@types/WalletConnectCommandParamName';
import useAssetIdName from '../../hooks/useAssetIdName';

export type WalletConnectCATAmountProps = {
  amount: number;
  values: Record<string, any>;
};

export default function WalletConnectCATAmount(props: WalletConnectCATAmountProps) {
  const { amount, values } = props;
  const { lookupByWalletId } = useAssetIdName();

  const walletId = values[WalletConnectCommandParamName.WALLET_ID];
  const assetIdInfo = lookupByWalletId(walletId);
  const displayName = assetIdInfo?.displayName;
  const currencyCode = displayName ?? t`Unknown CAT`;

  return <MojoToCAT value={amount} currencyCode={currencyCode} />;
}

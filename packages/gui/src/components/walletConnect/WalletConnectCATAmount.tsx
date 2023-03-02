import { MojoToCAT } from '@chia-network/core';
import { t } from '@lingui/macro';
import React from 'react';

import type WalletConnectCommandParam from '../../@types/WalletConnectCommandParam';
import WalletConnectCommandParamName from '../../@types/WalletConnectCommandParamName';
import useAssetIdName from '../../hooks/useAssetIdName';

export type WalletConnectCATAmountProps = {
  amount: number;
  params: WalletConnectCommandParam[];
};

export default function WalletConnectCATAmount(props: WalletConnectCATAmountProps) {
  const { amount, params } = props;
  const walletId = params.find((param) => param.name === WalletConnectCommandParamName.WALLET_ID)?.value;
  const { lookupByWalletId } = useAssetIdName();
  const assetIdInfo = lookupByWalletId(walletId);
  const displayName = assetIdInfo?.displayName;
  const currencyCode = displayName ?? t`Unknown CAT`;

  return <MojoToCAT value={amount} currencyCode={currencyCode} />;
}

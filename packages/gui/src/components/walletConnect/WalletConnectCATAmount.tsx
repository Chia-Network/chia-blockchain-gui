import { WalletType } from '@chia-network/api';
import { Flex, MojoToCAT, TooltipIcon } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { Chip } from '@mui/material';
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
  const currencyCode = assetIdInfo ? (
    <>
      {assetIdInfo.displayName}
      {assetIdInfo.walletType === WalletType.RCAT && (
        <>
          &nbsp;
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
    </>
  ) : (
    t`Unknown CAT`
  );

  return <MojoToCAT value={amount} currencyCode={currencyCode} />;
}

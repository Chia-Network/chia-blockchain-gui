import { WalletType, type Wallet } from '@chia-network/api';
import { useGetCatListQuery } from '@chia-network/api-react';
import { Flex, TooltipIcon, useCurrencyCode } from '@chia-network/core';
import { CrCat } from '@chia-network/icons';
import { t, Trans } from '@lingui/macro';
import { Typography, type TypographyProps } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

const StyledSymbol = styled(Typography)`
  font-size: 1rem;
`;

const STABLY_USDSC_ASSET_ID = '6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589';

const AssetIdTooltipMapping = {
  [STABLY_USDSC_ASSET_ID]: t`Classic version of Stably USDS as held by Prime Trust`,
};

export type WalletIconProps = TypographyProps & {
  wallet: Wallet;
  color?: string;
};

export default function WalletIcon(props: WalletIconProps) {
  const { wallet, color = 'primary', ...rest } = props;
  const { data: catList = [], isLoading } = useGetCatListQuery();
  const currencyCode = useCurrencyCode();

  if (wallet.type === WalletType.STANDARD_WALLET) {
    return (
      <StyledSymbol color={color} {...rest}>
        {currencyCode}
      </StyledSymbol>
    );
  }

  if (wallet.type === WalletType.CRCAT) {
    return (
      <StyledSymbol color={color} {...rest}>
        <CrCat sx={{ verticalAlign: 'middle' }} /> <Trans>Restricted CAT</Trans>
      </StyledSymbol>
    );
  }

  if (!isLoading && [WalletType.CAT, WalletType.RCAT, WalletType.CRCAT].includes(wallet.type)) {
    const token = catList.find((tokenItem) => tokenItem.assetId === wallet.meta?.assetId);
    if (token) {
      const tooltipText = AssetIdTooltipMapping[token.assetId];
      return (
        <StyledSymbol color={color} {...rest}>
          <Flex flexDirection="row" alignItems="center" gap={1}>
            {token.symbol}
            {tooltipText && <TooltipIcon>{tooltipText}</TooltipIcon>}
          </Flex>
        </StyledSymbol>
      );
    }
  }

  return null;
}

import { Flex } from '@chia/core';
import { Tab, Typography } from '@mui/material';
import React from 'react';

import WalletName from "../../constants/WalletName";
import useTrans from '../../hooks/useTrans';
import Wallet from "../../types/Wallet";

type Props = {
  wallet: Wallet;
  variant: 'tab' | 'card',
};

export default function WalletTab(props: Props) {
  const { title, description, active, onSelect, ...rest } = props;
  const { name, type, id } = wallet;
  const t = useTrans();

  const walletBaseName = t(WalletName[type]);

  const label = (
    <Flex flexDirection="column" gap={0.5} alignItems="flex-start">
      <Typography variant="body2">{title}</Typography>
      <Typography variant="body2" color="textSecondary">{description}</Typography>
    </Flex>
  );

  if (variant === 'card') {
    return (
      <StyledCard onSelect={onSelect}>
        <Flex flexDirection="column" gap={0.5} alignItems="flex-start">
          <Typography variant="body2">{title}</Typography>
          <Typography variant="body2" color="textSecondary">{description}</Typography>
        </Flex>
      </StyledCard>
    );
  }

  return (
    <Tab
      label={label}
      {...rest}
      value={id.toString()} 
    />
  )
}

WalletTab.defaultProps = {
  variant: 'tab',
};
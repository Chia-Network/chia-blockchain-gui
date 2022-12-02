import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';
import WalletConnectIcon from './images/walletConnect.svg';

export default function WalletConnect(props: SvgIconProps) {
  return (
    <SvgIcon component={WalletConnectIcon} viewBox="0 0 24 24" {...props} />
  );
}

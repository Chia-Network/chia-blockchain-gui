import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import ConnectCancelIcon from './images/cancelConnect.svg';
import ConnectCheckmarkIcon from './images/checkmarkConnect.svg';
import ExitIcon from './images/exit.svg';
import ConnectReloadIcon from './images/reloadConnect.svg';
import WalletConnectIcon from './images/walletConnect.svg';

export default function WalletConnect(props: SvgIconProps) {
  return <SvgIcon component={WalletConnectIcon} inheritViewBox {...props} />;
}

export function ConnectCheckmark(props: SvgIconProps) {
  return <SvgIcon component={ConnectCheckmarkIcon} {...props} viewBox="-5 -5 21 21" />;
}
export function ConnectCancel(props: SvgIconProps) {
  return <SvgIcon component={ConnectCancelIcon} {...props} viewBox="-5 -5 21 21" />;
}
export function ConnectReload(props: SvgIconProps) {
  return <SvgIcon component={ConnectReloadIcon} viewBox="-5 -5 21 21" {...props} />;
}
export function Exit(props: SvgIconProps) {
  return <SvgIcon component={ExitIcon} {...props} />;
}

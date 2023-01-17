import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import ConnectCancelIcon from './images/cancelConnect.svg';
import ConnectCheckmarkIcon from './images/checkmarkConnect.svg';
import ExitIcon from './images/exit.svg';
import ConnectReloadIcon from './images/reloadConnect.svg';
import WalletConnectIcon from './images/walletConnect.svg';

export default function WalletConnect(props: SvgIconProps) {
  return <SvgIcon component={WalletConnectIcon} viewBox="0 0 24 24" {...props} />;
}

export function ConnectCheckmark(props: SvgIconProps) {
  return <SvgIcon component={ConnectCheckmarkIcon} {...props} viewBox="-2 -3 20 20" />;
}
export function ConnectCancel(props: SvgIconProps) {
  return <SvgIcon component={ConnectCancelIcon} {...props} viewBox="-3 -3 20 20" />;
}
export function ConnectReload(props: SvgIconProps) {
  return <SvgIcon component={ConnectReloadIcon} viewBox="-1 0 21 21" {...props} />;
}
export function Exit(props: SvgIconProps) {
  return <SvgIcon component={ExitIcon} {...props} />;
}

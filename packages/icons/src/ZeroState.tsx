import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import CoinsIcon from './images/zero-state-coins.svg';

export default function Coins(props: SvgIconProps) {
  return <SvgIcon component={CoinsIcon} {...props} viewBox="0 0 931 435" style={{ width: '931px', height: '435px' }} />;
}

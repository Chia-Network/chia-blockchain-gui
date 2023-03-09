import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import BurnIcon from './images/Burn.svg';

export default function Tokens(props: SvgIconProps) {
  return <SvgIcon component={BurnIcon} viewBox="0 0 21 22" {...props} />;
}

import { SvgIcon, SvgIconProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import CoinsIconDark from './images/zero-state-coins-dark.svg';
import CoinsIcon from './images/zero-state-coins.svg';

export default function Coins(props: SvgIconProps) {
  const theme = useTheme();

  if (theme.palette.mode === 'dark') {
    return (
      <SvgIcon component={CoinsIconDark} {...props} viewBox="0 0 931 435" style={{ width: '931px', height: '435px' }} />
    );
  }

  return <SvgIcon component={CoinsIcon} {...props} viewBox="0 0 931 435" style={{ width: '931px', height: '435px' }} />;
}

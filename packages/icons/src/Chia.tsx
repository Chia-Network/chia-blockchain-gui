import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import ChiaBlackIcon from './images/chia-black.svg';
import ChiaIcon from './images/chia.svg';

export default function Keys(props: SvgIconProps) {
  return <SvgIcon component={ChiaIcon} viewBox="0 0 150 58" {...props} />;
}

export function ChiaBlack(props: SvgIconProps) {
  return <SvgIcon component={ChiaBlackIcon} viewBox="0 0 100 39" sx={{ width: '100px', height: '39px' }} {...props} />;
}

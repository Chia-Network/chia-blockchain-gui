import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import CrCatIcon from './images/CrCat.svg';

export default function CrCat(props: SvgIconProps) {
  const { sx, ...rest } = props;
  return <SvgIcon component={CrCatIcon} sx={{ fill: 'none', ...sx }} viewBox="0 0 24 24" {...rest} />;
}

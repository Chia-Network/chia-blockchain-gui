import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import PlotsIcon from './images/Plots.svg';

export default function Plots(props: SvgIconProps) {
  return <SvgIcon component={PlotsIcon} viewBox="0 0 26 32" {...props} />;
}

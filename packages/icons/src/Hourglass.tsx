import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import HourglassIcon from './images/Hourglass.svg';

export default function Hourglass(props: SvgIconProps) {
  return <SvgIcon component={HourglassIcon} viewBox="0 0 16 27" {...props} />;
}

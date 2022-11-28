import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import FeesIcon from './images/Fees.svg';

export default function Fees(props: SvgIconProps) {
  return <SvgIcon component={FeesIcon} viewBox="0 0 40 40" {...props} />;
}

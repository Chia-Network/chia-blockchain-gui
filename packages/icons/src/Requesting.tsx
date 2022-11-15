import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import RequestingIcon from './images/Requesting.svg';

export default function Requesting(props: SvgIconProps) {
  return <SvgIcon component={RequestingIcon} viewBox="0 0 36 30" {...props} />;
}

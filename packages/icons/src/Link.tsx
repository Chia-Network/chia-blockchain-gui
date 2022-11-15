import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import LinkSmallIcon from './images/LinkSmall.svg';

export default function LinkSmall(props: SvgIconProps) {
  return <SvgIcon component={LinkSmallIcon} viewBox="0 0 18 18" {...props} />;
}

import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import OverviewIcon from './images/Overview.svg';

export default function Overview(props: SvgIconProps) {
  return <SvgIcon component={OverviewIcon} viewBox="0 0 32 32" {...props} />;
}

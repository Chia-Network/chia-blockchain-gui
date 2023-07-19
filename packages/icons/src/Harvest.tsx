import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import HarvestIcon from './images/Harvest.svg';

export default function Harvest(props: SvgIconProps) {
  return <SvgIcon component={HarvestIcon} viewBox="0 0 32 32" {...props} />;
}

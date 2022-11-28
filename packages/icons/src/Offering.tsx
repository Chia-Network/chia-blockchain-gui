import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import OfferingIcon from './images/Offering.svg';

export default function Offering(props: SvgIconProps) {
  return <SvgIcon component={OfferingIcon} viewBox="0 0 37 30" {...props} />;
}

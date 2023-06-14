import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import VCIcon from './images/vc.svg';

export default function VC(props: SvgIconProps) {
  return <SvgIcon component={VCIcon} inheritViewBox {...props} />;
}

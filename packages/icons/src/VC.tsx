import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import VCIcon from './images/vc.svg';

function VCIconWithoutFill(props: SvgIconProps) {
  return <VCIcon {...props} style={{ fill: 'none' }} />;
}

export default function VC(props: SvgIconProps) {
  return <SvgIcon component={VCIconWithoutFill} inheritViewBox {...props} />;
}

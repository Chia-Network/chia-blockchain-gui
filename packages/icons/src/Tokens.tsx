import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import TokensIcon from './images/Tokens.svg';

export default function Tokens(props: SvgIconProps) {
  return <SvgIcon component={TokensIcon} viewBox="0 0 37 28" {...props} />;
}

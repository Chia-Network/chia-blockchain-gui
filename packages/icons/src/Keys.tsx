import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import KeysIcon from './images/keys.svg';

export default function Keys(props: SvgIconProps) {
  return <SvgIcon component={KeysIcon} viewBox="0 0 32 33" {...props} />;
}

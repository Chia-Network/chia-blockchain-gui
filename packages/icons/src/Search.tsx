import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import SearchIcon from './images/search.svg';

export default function Search(props: SvgIconProps) {
  return <SvgIcon component={SearchIcon} {...props} />;
}

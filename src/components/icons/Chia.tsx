import React from 'react';
import { SvgIcon, SvgIconProps } from '@material-ui/core';
import { ReactComponent as ChiaIcon } from './images/chia.svg';

export default function Keys(props: SvgIconProps) {
  return <SvgIcon component={ChiaIcon} viewBox="-150 -30 1000 280"  width="150" height="58" {...props} />;
}

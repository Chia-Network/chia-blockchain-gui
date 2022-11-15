import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import SettingsIcon from './images/settings.svg';

export default function Settings(props: SvgIconProps) {
  return <SvgIcon component={SettingsIcon} viewBox="0 0 30 30" {...props} />;
}

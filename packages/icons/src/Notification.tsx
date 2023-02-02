import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import NotificationIcon from './images/notification.svg';

export default function Notification(props: SvgIconProps) {
  return <SvgIcon component={NotificationIcon} sx={{ fill: 'none' }} viewBox="-2 -1 24 24" {...props} />;
}

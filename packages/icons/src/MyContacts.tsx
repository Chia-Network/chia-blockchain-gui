import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import MyContactsIcon from './images/MyContacts.svg';

export default function MyContacts(props: SvgIconProps) {
  return <SvgIcon component={MyContactsIcon} viewBox="0 0 32 32" {...props} />;
}

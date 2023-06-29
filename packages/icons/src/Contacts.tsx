import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import ContactsIcon from './images/contacts.svg';

export default function Contacts(props: SvgIconProps) {
  return <SvgIcon component={ContactsIcon} viewBox="0 0 40 40" {...props} />;
}

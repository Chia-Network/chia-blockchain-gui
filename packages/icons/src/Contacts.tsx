import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import ContactsIcon from './images/contacts.svg';

export default function Contacts(props: SvgIconProps) {
  return <SvgIcon component={ContactsIcon} viewBox="0 0 30 32" {...props} />;
}

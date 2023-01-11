import { Collapse } from '@mui/material';
import React, { ReactNode } from 'react';

type Props = {
  children?: ReactNode;
  expanded?: boolean;
};

export default function Accordion({ expanded = false, children }: Props) {
  return <Collapse in={expanded}>{children}</Collapse>;
}

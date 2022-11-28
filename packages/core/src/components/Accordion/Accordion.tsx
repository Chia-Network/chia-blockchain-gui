import { Collapse } from '@mui/material';
import React, { ReactNode } from 'react';

type Props = {
  children?: ReactNode;
  expanded?: boolean;
};

export default function Accordion(props: Props) {
  const { expanded, children } = props;

  return <Collapse in={expanded}>{children}</Collapse>;
}

Accordion.defaultProps = {
  children: undefined,
  expanded: false,
};

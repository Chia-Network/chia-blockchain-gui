import { Typography } from '@mui/material';
import React, { type ReactNode } from 'react';

export type SettingsLabelProps = {
  children?: ReactNode;
};

export default function SettingsLabel(props: SettingsLabelProps) {
  const { children } = props;

  return (
    <Typography variant="body1" component="div">
      {children}
    </Typography>
  );
}

import { Typography } from '@mui/material';
import React, { type ReactNode } from 'react';

export type SettingsTextProps = {
  children?: ReactNode;
};

export default function SettingsText(props: SettingsTextProps) {
  const { children } = props;

  return (
    <Typography variant="body2" color="textSecondary" component="div">
      {children}
    </Typography>
  );
}

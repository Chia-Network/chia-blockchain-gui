import { Typography } from '@mui/material';
import React, { type ReactNode } from 'react';

export type SettingsTitleProps = {
  children?: ReactNode;
};

export default function SettingsTitle(props: SettingsTitleProps) {
  const { children } = props;

  return (
    <Typography variant="body1" component="div">
      {children}
    </Typography>
  );
}

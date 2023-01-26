import { Typography } from '@mui/material';
import React, { type ReactNode } from 'react';

export type SettingsSectionProps = {
  children?: ReactNode;
};

export default function SettingsSection(props: SettingsSectionProps) {
  const { children } = props;

  return (
    <Typography variant="h6" fontWeight="500" component="div">
      {children}
    </Typography>
  );
}

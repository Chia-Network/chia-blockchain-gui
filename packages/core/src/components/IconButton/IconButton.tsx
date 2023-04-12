import { IconButton, type IconButtonProps } from '@mui/material';
import React from 'react';

export default function StyledIconButton(props: IconButtonProps) {
  return <IconButton {...props} sx={{ padding: '0.2rem' }} />;
}

import { DialogActions, type DialogActionsProps } from '@mui/material';
import React from 'react';

export default function StyledDialogActions(props: DialogActionsProps) {
  return <DialogActions {...props} sx={{ padding: (theme) => `${theme.spacing(2)} ${theme.spacing(3)}` }} />;
}

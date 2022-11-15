import { Trans } from '@lingui/macro';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import React, { ReactNode } from 'react';

import Button from '../Button';
import type { ButtonProps } from '../Button';
import DialogActions from '../DialogActions';

export type AlertDialogProps = {
  title?: ReactNode;
  children?: ReactNode;
  open?: boolean;
  onClose?: (value?: any) => void;
  confirmTitle?: ReactNode;
  confirmVariant?: ButtonProps['variant'];
};

export default function AlertDialog(props: AlertDialogProps) {
  const {
    onClose = () => {},
    open = false,
    title,
    confirmTitle = <Trans>OK</Trans>,
    confirmVariant = 'outlined',
    children,
  } = props;

  function handleClose() {
    onClose?.(true);
  }

  function handleHide() {
    onClose?.();
  }

  return (
    <Dialog
      onClose={handleHide}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      open={open}
    >
      {title && <DialogTitle id="alert-dialog-title">{title}</DialogTitle>}
      {children && <DialogContent id="alert-dialog-description">{children}</DialogContent>}

      <DialogActions>
        <Button onClick={handleClose} variant={confirmVariant} color="primary" autoFocus>
          {confirmTitle}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

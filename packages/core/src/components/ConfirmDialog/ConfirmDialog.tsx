import { Trans } from '@lingui/macro';
import { Dialog, DialogTitle, DialogContent, DialogContentText } from '@mui/material';
import React, { type ReactNode, useEffect, useState, useCallback } from 'react';

import useShowError from '../../hooks/useShowError';
import Button from '../Button';
import ButtonLoading from '../ButtonLoading';
import type { ButtonLoadingProps } from '../ButtonLoading/ButtonLoading';
import DialogActions from '../DialogActions';

export type ConfirmDialogProps = {
  title?: ReactNode;
  children?: ReactNode;
  open?: boolean;
  onClose?: (value: boolean) => void;
  confirmTitle: ReactNode;
  cancelTitle: ReactNode;
  confirmColor?: ButtonLoadingProps['color'];
  onConfirm?: () => Promise<void>;
  disableConfirmButton?: boolean;
  autoClose?: 'confirm' | 'cancel';
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
};

export default function ConfirmDialog(props: ConfirmDialogProps) {
  const {
    onClose = () => {},
    open = false,
    title,
    children,
    cancelTitle = <Trans>Cancel</Trans>,
    confirmTitle = <Trans>OK</Trans>,
    confirmColor = 'default',
    onConfirm,
    disableConfirmButton,
    autoClose,
    disableBackdropClick = false,
    disableEscapeKeyDown = false,
    ...rest
  } = props;

  const [loading, setLoading] = useState<boolean>(false);
  const showError = useShowError();

  const handleConfirm = useCallback(async () => {
    if (onConfirm) {
      try {
        setLoading(true);
        await onConfirm();
      } catch (error: any) {
        showError(error);
      } finally {
        setLoading(false);
      }
    }

    onClose(true);
  }, [onConfirm, setLoading, showError, onClose]);

  const handleCancel = useCallback(() => {
    onClose(false);
  }, [onClose]);

  useEffect(() => {
    // When `autoClose` prop is set, it acts like clicking confirm/cancel button from code.
    if (autoClose === 'cancel') {
      handleCancel();
    } else if (autoClose === 'confirm') {
      handleConfirm();
    }
  }, [autoClose, handleConfirm, handleCancel]);

  const handleDialogClose = useCallback(
    (_event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
      if (disableBackdropClick && reason === 'backdropClick') return;
      if (disableEscapeKeyDown && reason === 'escapeKeyDown') return;
      handleCancel();
    },
    [disableBackdropClick, disableEscapeKeyDown, handleCancel],
  );

  return (
    <Dialog
      onClose={handleDialogClose}
      disableEscapeKeyDown={disableEscapeKeyDown}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      open={!autoClose && open}
      {...rest}
    >
      {title && <DialogTitle id="alert-dialog-title">{title}</DialogTitle>}
      {children && (
        <DialogContent>
          <DialogContentText id="alert-dialog-description">{children}</DialogContentText>
        </DialogContent>
      )}

      <DialogActions>
        <Button onClick={handleCancel} color="secondary" variant="outlined" autoFocus>
          {cancelTitle}
        </Button>
        <ButtonLoading
          onClick={handleConfirm}
          color={confirmColor}
          variant="contained"
          loading={loading}
          disabled={disableConfirmButton}
        >
          {confirmTitle}
        </ButtonLoading>
      </DialogActions>
    </Dialog>
  );
}

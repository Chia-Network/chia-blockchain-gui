import { EstimatedFee, FeeTxType, Form, ButtonLoading, DialogActions, Flex, Button } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Dialog, DialogTitle, DialogContent, DialogContentText, Typography } from '@mui/material';
import React, { useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';

export type ConfirmDialogProps = {
  vcTitle: string;
  onClose?: (value: any) => void;
  isLocal: boolean;
  confirmTitle?: ReactNode;
  cancelTitle?: ReactNode;
  title?: ReactNode;
  content?: ReactNode;
};

type FeeValueType = {
  fee: string;
};

export default function VCRevokeDialog(props: ConfirmDialogProps) {
  const confirmColor = 'danger';
  const {
    vcTitle,
    onClose = () => {},
    isLocal,
    confirmTitle = <Trans>Confirm</Trans>,
    cancelTitle = <Trans>Cancel</Trans>,
    content,
    title,
  } = props;

  const methods = useForm<FeeValueType>({
    defaultValues: {
      fee: '',
    },
  });

  const revokeFee = useWatch({
    control: methods.control,
    name: 'fee',
  });

  const {
    formState: { isSubmitting },
  } = methods;

  const handleConfirm = useCallback(async () => {
    onClose(isLocal ? -1 : revokeFee);
  }, [revokeFee, onClose, isLocal]);

  const handleCancel = useCallback(() => {
    onClose(-2);
  }, [onClose]);

  return (
    <Dialog
      onClose={handleCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      open
    >
      {title && <DialogTitle id="alert-dialog-title">{title}</DialogTitle>}

      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          <Flex flexDirection="column" gap={3}>
            <Typography variant="body1">
              {content}
              <b>{` ${vcTitle}`}</b>?
            </Typography>
            {!isLocal && (
              <Form methods={methods}>
                <EstimatedFee
                  id="filled-secondary"
                  variant="filled"
                  name="fee"
                  color="secondary"
                  disabled={isSubmitting}
                  label={<Trans>Fee</Trans>}
                  fullWidth
                  txType={FeeTxType.walletSendXCH}
                />
              </Form>
            )}
          </Flex>
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel} color="secondary" variant="outlined" autoFocus>
          {cancelTitle}
        </Button>
        <ButtonLoading onClick={handleConfirm} color={confirmColor} variant="contained">
          {confirmTitle}
        </ButtonLoading>
      </DialogActions>
    </Dialog>
  );
}

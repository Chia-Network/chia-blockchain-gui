import { EstimatedFee, FeeTxType, Form, ButtonLoading, DialogActions, Flex, Button } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Dialog, DialogTitle, DialogContent, DialogContentText, Typography } from '@mui/material';
import React, { useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';

export type ConfirmDialogProps = {
  vcTitle: string;
  onClose?: (value: any) => void;
};

type FeeValueType = {
  fee: string;
};

export default function VCRevokeDialog(props: ConfirmDialogProps) {
  const confirmTitle = <Trans>Yes, Revoke</Trans>;
  const cancelTitle = <Trans>Cancel</Trans>;
  const title = <Trans>Confirm Revoke</Trans>;
  const confirmColor = 'danger';
  const { vcTitle, onClose = () => {} } = props;
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
    onClose(revokeFee);
  }, [revokeFee, onClose]);

  const handleCancel = useCallback(() => {
    onClose(-1);
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
              <Trans>Are you sure you want to revoke</Trans>
              <b>{` ${vcTitle}`}</b>?
            </Typography>
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

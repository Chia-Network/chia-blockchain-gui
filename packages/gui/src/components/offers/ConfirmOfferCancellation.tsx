import {
  Button,
  ButtonLoading,
  EstimatedFee,
  FeeTxType,
  Flex,
  Form,
  TooltipIcon,
  chiaToMojo,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import {
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Grid,
  Typography,
} from '@mui/material';
import BigNumber from 'bignumber.js';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

export type ConfirmOfferCancellationProps = {
  canCancelWithTransaction?: boolean;
  onClose?: (value: any) => void;
  open?: boolean;
};

export function ConfirmOfferCancellation(props: ConfirmOfferCancellationProps) {
  const { canCancelWithTransaction = true, onClose = () => {}, open = true } = props;
  const methods = useForm({
    defaultValues: {
      fee: '',
    },
  });
  const [cancelWithTransaction, setCancelWithTransaction] = useState<boolean>(canCancelWithTransaction);

  function handleCancel() {
    onClose([false]);
  }

  async function handleConfirm() {
    const { fee: xchFee } = methods.getValues();

    const fee = cancelWithTransaction ? chiaToMojo(xchFee) : new BigNumber(0);

    onClose([true, { cancelWithTransaction, cancellationFee: fee }]);
  }

  return (
    <Dialog
      onClose={handleCancel}
      open={open}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        <Trans>Cancel Offer</Trans>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          <Form methods={methods} onSubmit={handleConfirm}>
            <Flex flexDirection="column" gap={3}>
              <Typography variant="body1">
                <Trans>Are you sure you want to cancel your offer?</Trans>
              </Typography>
              {canCancelWithTransaction && (
                <>
                  <Typography variant="body1">
                    <Trans>
                      If you have already shared your offer file, you may need to submit a transaction to cancel the
                      pending offer. Click "Cancel on blockchain" to submit a cancellation transaction.
                    </Trans>
                  </Typography>
                  <Flex flexDirection="row" gap={3}>
                    <Grid container>
                      <Grid xs={6} item>
                        <FormControlLabel
                          control={
                            <Checkbox
                              name="cancelWithTransaction"
                              checked={cancelWithTransaction}
                              onChange={(event) => setCancelWithTransaction(event.target.checked)}
                            />
                          }
                          label={
                            <>
                              <Trans>Cancel on blockchain</Trans>{' '}
                              <TooltipIcon>
                                <Trans>
                                  Creates and submits a transaction on the blockchain that cancels the offer
                                </Trans>
                              </TooltipIcon>
                            </>
                          }
                        />
                      </Grid>
                      {cancelWithTransaction && (
                        <Grid xs={6} item>
                          <EstimatedFee
                            id="filled-secondary"
                            variant="filled"
                            name="fee"
                            color="secondary"
                            label={<Trans>Fee</Trans>}
                            fullWidth
                            txType={FeeTxType.cancelOffer}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Flex>
                </>
              )}
            </Flex>
          </Form>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Flex flexDirection="row" gap={3} style={{ paddingBottom: '8px', paddingRight: '16px' }}>
          <Button onClick={handleCancel} color="secondary" variant="outlined" autoFocus>
            <Trans>Close</Trans>
          </Button>
          <ButtonLoading onClick={handleConfirm} color="danger" variant="contained">
            <Trans>Cancel Offer</Trans>
          </ButtonLoading>
        </Flex>
      </DialogActions>
    </Dialog>
  );
}

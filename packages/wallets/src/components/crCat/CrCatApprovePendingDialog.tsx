import { useGetSyncStatusQuery, useCrCatApprovePendingMutation } from '@chia-network/api-react';
import {
  AlertDialog,
  Button,
  Form,
  ButtonLoading,
  EstimatedFee,
  FeeTxType,
  Flex,
  chiaToMojo,
  useOpenDialog,
  sleep,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Close as CloseIcon } from '@mui/icons-material';
import { Alert, Box, Dialog, DialogActions, DialogTitle, DialogContent, IconButton, Typography } from '@mui/material';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';

type FormData = {
  fee: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  walletId: number;
  amount: number;
  amountHuman: string;
};

export default function CrCatApprovePendingDialog(props: Props) {
  const { onClose, onSuccess, open, walletId, amount, amountHuman } = props;
  const [crCatApprovePending] = useCrCatApprovePendingMutation();
  const openDialog = useOpenDialog();

  const methods = useForm<FormData>({
    defaultValues: { fee: '' },
  });

  const feeValue = useWatch({
    control: methods.control,
    name: 'fee',
  });

  const { data: walletState, isLoading: isWalletSyncLoading } = useGetSyncStatusQuery(undefined, {
    pollingInterval: 10_000,
  });
  const isSyncing = isWalletSyncLoading || !!walletState?.syncing;
  const isSynced = !isSyncing && walletState?.synced;

  const { isSubmitting } = methods.formState;

  const canSubmit = isSynced && !isSubmitting && feeValue !== '';

  function handleClose() {
    methods.reset();
    onClose();
  }

  function handleDialogClose(event: any, reason: any) {
    if (reason !== 'backdropClick' || reason !== 'EscapeKeyDown') {
      onClose();
    }
  }

  async function handleSubmit(values: FormData) {
    const { fee } = values;
    const feeInMojos = chiaToMojo(fee);
    const response = await crCatApprovePending({ walletId, minAmountToClaim: amount, fee: feeInMojos }).unwrap();

    if (!response.transactions || response.transactions.length === 0) {
      throw new Error('No transaction returned');
    }

    // It takes a while for the backend to return pendingApprovalBalance = 0 after approving
    await sleep(6 * 1000);
    onSuccess();
    onClose();
    openDialog(
      <AlertDialog title={<Trans>Payments approved</Trans>}>
        <Trans>Please allow some time for the payments to reflect in the blockchain.</Trans>
      </AlertDialog>,
    );
  }

  return (
    <Dialog onClose={handleDialogClose} maxWidth="lg" aria-labelledby="confirmation-dialog-title" open={open}>
      <DialogTitle id="confirmation-dialog-title" sx={{ minWidth: '550px' }}>
        <Trans>Approve pending CR-CAT transactions</Trans>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Form methods={methods} onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Flex gap={2} flexDirection="column" sx={{ textAlign: 'center', alignItems: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5">{amountHuman}</Typography>
            </Box>

            {!isSynced && (
              <Alert severity="info" sx={{ marginBottom: 3 }}>
                <Trans>Wallet needs to be synced before approving transactions</Trans>
              </Alert>
            )}

            <Typography variant="body1">
              <Trans>Please enter a transaction fee to approve the above amount:</Trans>
            </Typography>

            <EstimatedFee
              variant="filled"
              name="fee"
              color="secondary"
              fullWidth
              sx={{ width: '300px', textAlign: 'left' }}
              txType={FeeTxType.walletSendXCH}
            />
          </Flex>
        </DialogContent>

        <DialogActions>
          <Button autoFocus onClick={handleClose} color="secondary">
            <Trans>Close</Trans>
          </Button>

          <ButtonLoading
            type="submit"
            disabled={!canSubmit}
            loading={isSubmitting}
            variant="contained"
            color="primary"
            disableElevation
          >
            <Trans>Approve pending transactions</Trans>
          </ButtonLoading>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

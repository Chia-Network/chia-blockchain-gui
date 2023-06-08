import { useGetAutoClaimQuery, useSetAutoClaimMutation, useSpendClawbackCoinsMutation } from '@chia-network/api-react';
import {
  AlertDialog,
  Button,
  Form,
  ButtonLoading,
  Fee,
  useCurrencyCode,
  mojoToChia,
  FormatLargeNumber,
  truncateValue,
  CopyToClipboard,
  Flex,
  chiaToMojo,
  Checkbox,
  useOpenDialog,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Close as CloseIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';

type FormData = {
  fee: number;
  shouldEnableAutoClaim: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  coinId: string;
  amountInMojo: number;
  fromOrTo: 'from' | 'to';
  address: string;
};

export default function ClawbackClaimTransactionDialog(props: Props) {
  // console.log('props: ', props);
  const { onClose, open, coinId, amountInMojo, fromOrTo, address } = props;
  const [setAutoClaim] = useSetAutoClaimMutation();
  const [spendClawbackCoins] = useSpendClawbackCoinsMutation();
  const { data: autoClaimData, isLoading: isGetAutoClaimLoading } = useGetAutoClaimQuery();
  const openDialog = useOpenDialog();

  const isAutoClaimEnabled = autoClaimData?.enabled;
  const autoClaimFee = autoClaimData?.txFee ? mojoToChia(autoClaimData.txFee) : 0;

  const willBeAutoClaimed = isAutoClaimEnabled && fromOrTo === 'from';

  const currencyCode = useCurrencyCode();
  const methods = useForm<FormData>({
    defaultValues: { fee: undefined, shouldEnableAutoClaim: false },
  });

  const shouldEnableAutoClaimValue = useWatch<boolean>({
    control: methods.control,
    name: 'shouldEnableAutoClaim',
  });

  const feeValue = useWatch<number | undefined>({
    control: methods.control,
    name: 'fee',
  });

  const { isSubmitting } = methods.formState;

  const canSubmit = !isSubmitting && !isGetAutoClaimLoading && feeValue && feeValue > 0;

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
    const { fee, shouldEnableAutoClaim } = values;
    const feeInMojos = chiaToMojo(fee);
    const response = await spendClawbackCoins({ coinIds: [coinId], fee: feeInMojos }).unwrap();
    if (response.transactionIds.length === 0) {
      throw new Error('No transaction ids returned');
    }

    if (shouldEnableAutoClaim) {
      // do not error on this secondary action
      try {
        await setAutoClaim({
          enabled: true,
          txFee: feeInMojos,
          minAmount: feeInMojos,
          batchSize: 50,
        }).unwrap();
      } catch (e) {
        console.error('Error setting auto claim: ', e);
      }
    }

    onClose();
    openDialog(
      <AlertDialog title="">
        {fromOrTo === 'from' ? <Trans>Clawback payment claimed</Trans> : <Trans>Clawback payment clawed back</Trans>}
      </AlertDialog>
    );
  }

  return (
    <Dialog onClose={handleDialogClose} maxWidth="lg" aria-labelledby="confirmation-dialog-title" open={open}>
      <DialogTitle id="confirmation-dialog-title" sx={{ minWidth: '550px' }}>
        {fromOrTo === 'from' ? <Trans>Claim Transaction</Trans> : <Trans>Claw Back Transaction</Trans>}
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
      {isGetAutoClaimLoading && (
        <>
          <DialogContent dividers>
            <Typography variant="body1">Loading...</Typography>
          </DialogContent>{' '}
          <DialogActions>
            <Button autoFocus onClick={handleClose} color="secondary">
              <Trans>Close</Trans>
            </Button>
          </DialogActions>
        </>
      )}
      {!isGetAutoClaimLoading && (
        <Form methods={methods} onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Flex gap={2} flexDirection="column" sx={{ textAlign: 'center', alignItems: 'center' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5">
                  <FormatLargeNumber value={mojoToChia(amountInMojo)} />{' '}
                  <Box component="span" sx={{ color: (theme) => theme.palette.grey[600] }}>
                    {currencyCode}
                  </Box>
                </Typography>
                <Typography variant="subtitle1" sx={{ mt: 1 }}>
                  <Box component="span" sx={{ color: (theme) => theme.palette.grey[600] }}>
                    {fromOrTo === 'from' ? <Trans>From:</Trans> : <Trans>To:</Trans>}{' '}
                  </Box>
                  <Tooltip
                    title={
                      <Flex flexDirection="column" gap={1}>
                        <Flex flexDirection="row" alignItems="center" gap={1}>
                          <Box maxWidth={200}>{address}</Box>
                          <CopyToClipboard value={address} fontSize="small" />
                        </Flex>
                      </Flex>
                    }
                  >
                    <span>{truncateValue(address, {})}</span>
                  </Tooltip>
                </Typography>
              </Box>
              {willBeAutoClaimed && (
                <Alert severity="info" sx={{ marginBottom: 3 }}>
                  <Trans>This transaction will be automatically claimed with a fee:</Trans>{' '}
                  {`${autoClaimFee} ${currencyCode}`}
                </Alert>
              )}

              <Typography variant="body1">
                {fromOrTo === 'from' ? (
                  <Trans>Please enter a transaction fee to claim the above amount:</Trans>
                ) : (
                  <Trans>Please enter a transaction fee to claw back the above amount:</Trans>
                )}
              </Typography>
              <Fee
                id="filled-secondary"
                variant="filled"
                name="fee"
                color="secondary"
                label={<Trans>Transaction fee</Trans>}
                sx={{ width: '300px' }}
              />
            </Flex>
          </DialogContent>
          {!isAutoClaimEnabled && fromOrTo === 'from' && (
            <DialogContent dividers>
              <FormControlLabel
                control={<Checkbox name="shouldEnableAutoClaim" />}
                label={<Trans>Auto-claim transactions with this fee from now on. </Trans>}
              />
              {shouldEnableAutoClaimValue && (
                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                  <ul>
                    <li>
                      <Trans>Transactions will be claimed automatically when the Clawback time expires.</Trans>
                    </li>
                    <li>
                      <Trans>Transactions with values smaller than the fee will not be auto claimed.</Trans>
                    </li>
                    <li>
                      <Trans>You can change the Clawback Auto Claim fee in Settings.</Trans>
                    </li>
                  </ul>
                </Typography>
              )}
            </DialogContent>
          )}

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
              {fromOrTo === 'from' ? <Trans>Claim Transaction</Trans> : <Trans>Claw back Transaction</Trans>}
            </ButtonLoading>
          </DialogActions>
        </Form>
      )}
    </Dialog>
  );
}

import { toBech32m, fromBech32m } from '@chia-network/api';
import { useGetCurrentAddressQuery, useGetNFTInfoQuery, useSendNotificationsMutation } from '@chia-network/api-react';
import {
  AlertDialog,
  Amount,
  ButtonLoading,
  CopyToClipboard,
  EstimatedFee,
  Flex,
  Form,
  Loading,
  TextField,
  chiaToMojo,
  useCurrencyCode,
  useOpenDialog,
} from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  InputAdornment,
  Typography,
} from '@mui/material';
import React, { SyntheticEvent, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { launcherIdFromNFTId } from '../../util/nfts';
import NFTPreview from '../nfts/NFTPreview';
import { createOfferNotificationPayload } from './utils';

// const DEFAULT_MESSAGE_COST = '0.00001';

type NotificationSendDialogFormData = {
  address: string;
  amount: string;
  allowCounterOffer: boolean;
  fee: string;
};

export type NotificationSendDialogProps = {
  offerURL: string;
  nftId: string;
  // recommendedAmount?: string;
  open?: boolean;
  onClose?: () => void;
};

export default function NotificationSendDialog(props: NotificationSendDialogProps) {
  const {
    offerURL,
    nftId,
    // recommendedAmount = DEFAULT_MESSAGE_COST,
    onClose = () => ({}),
    open = false,
    ...rest
  } = props;
  const methods = useForm<NotificationSendDialogFormData>({
    defaultValues: { address: '', amount: '0.00001', allowCounterOffer: true, fee: '' },
  });
  const launcherId = launcherIdFromNFTId(nftId ?? '');
  const currencyCode = useCurrencyCode();
  const openDialog = useOpenDialog();
  const { data: nft } = useGetNFTInfoQuery({ coinId: launcherId ?? '' });
  const { data: currentAddress = '' } = useGetCurrentAddressQuery({ walletId: 1 });
  const [sendNotifications] = useSendNotificationsMutation();
  const [, setMetadata] = React.useState<any>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const address = methods.watch('address');
  const allowCounterOffer = methods.watch('allowCounterOffer');

  useEffect(() => {
    if (nft?.p2Address && currencyCode) {
      const p2Address = toBech32m(nft.p2Address, currencyCode);

      methods.setValue('address', p2Address);

      setIsLoading(false);
    }
  }, [nft, currencyCode, methods]);

  const nftPreviewContainer = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    backgroundColor: 'action.hover',
    border: '1px solid',
    borderColor: 'divider',
    width: '140px',
    height: '140px',
    padding: '8px',
  };

  async function handleSubmit(values: NotificationSendDialogFormData) {
    const { amount, fee } = values;
    const targetPuzzleHash = fromBech32m(address);
    const senderPuzzleHash = allowCounterOffer ? fromBech32m(currentAddress) : undefined;
    const amountMojos = chiaToMojo(amount);
    const feeMojos = chiaToMojo(fee);
    const payload = createOfferNotificationPayload({ offerURL, puzzleHash: senderPuzzleHash });
    let success = false;
    let error = '';

    const hexMessage = Buffer.from(payload).toString('hex');

    setIsSubmitting(true);

    try {
      const result = await sendNotifications({
        target: targetPuzzleHash,
        amount: amountMojos,
        message: hexMessage,
        fee: feeMojos,
      });

      success = result?.data?.success ?? false;
    } catch (e: any) {
      console.error(e);
      error = e.message;
    } finally {
      setIsSubmitting(false);
    }

    const resultDialog = (
      <AlertDialog title={success ? t`Success` : t`Failure`}>
        <Flex flexDirection="column" gap={3}>
          {success ? (
            <Trans>Notification has successfully been sent to a full node and included in the mempool.</Trans>
          ) : (
            <Trans>Failed to send the notification: {error}</Trans>
          )}
        </Flex>
      </AlertDialog>
    );

    if (resultDialog) {
      if (success) {
        onClose();
      }
      await openDialog(resultDialog);
    }
  }

  function handleClose() {
    onClose();
  }

  function handleToggleAllowCounterOffer(event: SyntheticEvent) {
    const { checked } = event.target as HTMLInputElement;
    methods.setValue('allowCounterOffer', checked);
  }

  return (
    <Dialog open={open} onClose={onClose} {...rest}>
      <Form methods={methods} onSubmit={handleSubmit}>
        <Box sx={{ width: '600px' }}>
          <Flex flexDirection="column">
            <DialogTitle id="nft-move-dialog-title">
              <Flex flexDirection="row" justifyContent="center" gap={1} paddingTop="20px">
                <Typography variant="h6">
                  <Trans>Notify NFT Holder of Offer</Trans>
                </Typography>
              </Flex>
            </DialogTitle>
            <DialogContent sx={{ paddingBottom: 5 }}>
              {isLoading ? (
                <Loading />
              ) : (
                <Flex flexDirection="column" alignItems="center" gap={3}>
                  <Box sx={nftPreviewContainer}>
                    <NFTPreview nft={nft} disableThumbnail setNFTCardMetadata={setMetadata} />
                  </Box>
                  <Flex flexDirection="column" alignItems="center" gap={1}>
                    {/* <Typography variant="h6">
                      <Trans>Message the NFT Holder</Trans>
                    </Typography> */}
                    <Typography variant="body1" color="textSecondary" align="center" sx={{ width: '380px' }}>
                      <Trans>
                        For a small fee, you can message the NFT holder to let them know about your offer. The message
                        cost will be a donation to the NFT holder.
                      </Trans>
                    </Typography>
                  </Flex>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        variant="filled"
                        name="address"
                        label={<Trans>NFT Holder Address</Trans>}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <CopyToClipboard value={address} />
                            </InputAdornment>
                          ),
                        }}
                        disabled
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Flex flexDirection="column" gap={1}>
                        <Amount
                          variant="filled"
                          name="amount"
                          label={<Trans>Cost to Send</Trans>}
                          disabled /* Will allow editing the message cost in the future */
                          autoFocus
                          fullWidth
                          required
                        />
                        {/* <Typography variant="body2" color="textSecondary">
                          <Trans>
                            Recommended value: {recommendedAmount} {currencyCode}
                          </Trans>
                        </Typography> */}
                      </Flex>
                    </Grid>
                    <Grid item xs={12}>
                      <EstimatedFee
                        name="fee"
                        label={<Trans>Transaction Fee</Trans>}
                        txType="walletSendXCH"
                        disabled={isSubmitting}
                        fullWidth
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sx={{
                        marginBottom: '-20px',
                      }}
                    >
                      <Flex flexDirection="column" gap={0}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              name="allowCounterOffer"
                              checked={allowCounterOffer}
                              onChange={handleToggleAllowCounterOffer}
                            />
                          }
                          label={<Trans>Allow the NFT holder to send a counter offer</Trans>}
                        />
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ paddingLeft: '31px', marginTop: '-8px' }}
                        >
                          Your receive address will be included in the message if this option is checked.
                        </Typography>
                      </Flex>
                    </Grid>
                  </Grid>
                </Flex>
              )}
            </DialogContent>
            <Divider />
            <DialogActions>
              <Flex flexDirection="row" gap={2} p={2}>
                <Button onClick={handleClose} color="primary" variant="outlined">
                  <Trans>Close</Trans>
                </Button>
                <ButtonLoading type="submit" color="primary" variant="contained" loading={isSubmitting}>
                  <Trans>Send Message</Trans>
                </ButtonLoading>
              </Flex>
            </DialogActions>
          </Flex>
        </Box>
      </Form>
    </Dialog>
  );
}

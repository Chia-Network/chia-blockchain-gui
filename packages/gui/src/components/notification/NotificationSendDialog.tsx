import { toBech32m, fromBech32m } from '@chia-network/api';
import { useGetNFTInfoQuery, useSendNotificationsMutation } from '@chia-network/api-react';
import {
  Amount,
  ButtonLoading,
  EstimatedFee,
  Flex,
  Form,
  Loading,
  TextField,
  chiaToMojo,
  useCurrencyCode,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Switch,
  Typography,
} from '@mui/material';
import React, { SyntheticEvent, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { launcherIdFromNFTId } from '../../util/nfts';
import NFTPreview from '../nfts/NFTPreview';

const DEFAULT_MESSAGE_COST = '0.00001';

type NotificationSendDialogFormData = {
  address: string;
  amount: string;
  allowCounterOffer: boolean;
  fee: string;
};

export type NotificationSendDialogProps = {
  offerURL: string;
  nftId: string;
  recommendedAmount?: string;
  open?: boolean;
  onClose?: () => void;
};

export default function NotificationSendDialog(props: NotificationSendDialogProps) {
  const {
    offerURL,
    nftId,
    recommendedAmount = DEFAULT_MESSAGE_COST,
    onClose = () => ({}),
    open = false,
    ...rest
  } = props;
  const methods = useForm<NotificationSendDialogFormData>({
    defaultValues: { address: '', amount: '', allowCounterOffer: true, fee: '' },
  });
  const launcherId = launcherIdFromNFTId(nftId ?? '');
  const currencyCode = useCurrencyCode();
  const { data: nft } = useGetNFTInfoQuery({ coinId: launcherId ?? '' });
  const [sendNotifications] = useSendNotificationsMutation();
  const [, setMetadata] = React.useState<any>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
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
    const { address, amount, allowCounterOffer, fee } = values;
    const hexMessage = Buffer.from(offerURL).toString('hex');
    const puzzleHash = fromBech32m(address);
    const amountMojos = chiaToMojo(amount);
    const feeMojos = chiaToMojo(fee);
    console.log('handleSubmit values:');
    console.log(values);

    setIsSubmitting(true);

    try {
      // wait for 3 seconds
      // await new Promise((resolve) => setTimeout(resolve, 3000));
      const result = await sendNotifications({
        target: puzzleHash,
        amount: amountMojos,
        message: hexMessage,
        fee: feeMojos,
      });

      console.log('result:');
      console.log(result);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
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
                  <Trans>Send an Offer Notification</Trans>
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
                    <Typography variant="h6">
                      <Trans>Message the NFT Holder</Trans>
                    </Typography>
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
                        disabled={isSubmitting}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Flex flexDirection="column" gap={1}>
                        <Amount
                          variant="filled"
                          name="amount"
                          label={<Trans>Message Cost</Trans>}
                          disabled={isSubmitting}
                          fullWidth
                          required
                        />
                        <Typography variant="body2" color="textSecondary">
                          <Trans>
                            Recommended value: {recommendedAmount} {currencyCode}
                          </Trans>
                        </Typography>
                      </Flex>
                    </Grid>
                    <Grid item xs={12}>
                      <Grid container spacing={3}>
                        <Grid item xs={8}>
                          <Typography variant="body2" color="textPrimary">
                            <Trans>
                              Allow the NFT holder to send a counter offer. Your receive address will be included in the
                              message.
                            </Trans>
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Flex flexDirection="row" justifyContent="flex-end">
                            <Switch
                              checked={allowCounterOffer}
                              onChange={handleToggleAllowCounterOffer}
                              disabled={isSubmitting}
                            />
                          </Flex>
                        </Grid>
                      </Grid>
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
                  </Grid>
                </Flex>
              )}
            </DialogContent>
            <Divider sx={{ width: '100%' }} />
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

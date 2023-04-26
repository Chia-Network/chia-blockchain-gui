import { type NFTInfo } from '@chia-network/api';
import { useTransferNFTMutation } from '@chia-network/api-react';
import {
  Button,
  ButtonLoading,
  EstimatedFee,
  FeeTxType,
  Form,
  Flex,
  TextField,
  chiaToMojo,
  useOpenDialog,
  useShowError,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import useBurnAddress from '../../hooks/useBurnAddress';
import useNFTFilter from '../../hooks/useNFTFilter';
import NFTSummary from './NFTSummary';
import NFTTransferConfirmationDialog from './NFTTransferConfirmationDialog';

type NFTPreviewDialogProps = {
  nfts: NFTInfo[];
  open?: boolean;
  onClose?: () => void;
};

type FormData = {
  fee: string;
  destination: string;
};

export default function NFTBurnDialog(props: NFTPreviewDialogProps) {
  const { nfts, onClose = () => ({}), open = false, ...rest } = props;
  const burnAddress = useBurnAddress();
  const openDialog = useOpenDialog();
  const showError = useShowError();
  const [transferNFT] = useTransferNFTMutation();
  const filter = useNFTFilter();

  const methods = useForm<FormData>({
    defaultValues: {
      fee: '',
      destination: '',
    },
  });

  const { isSubmitting } = methods.formState;

  useEffect(() => {
    if (burnAddress) {
      methods.setValue('destination', burnAddress);
    }
  }, [burnAddress, methods]);

  function handleClose() {
    onClose();
  }

  async function handleSubmit(values: FormData) {
    const { fee, destination } = values;
    if (!destination) {
      return;
    }

    const confirmation = await openDialog(
      <NFTTransferConfirmationDialog
        destination={destination}
        fee={fee}
        confirmColor="danger"
        title={<Trans>Burn NFT confirmation</Trans>}
        description={
          <Alert severity="warning" icon={false}>
            {nfts.length > 1 ? (
              <Trans>
                If you burn these NFTs, nobody (including you) will ever be able to access it again. Are you sure you
                want to continue?
              </Trans>
            ) : (
              <Trans>
                If you burn this NFT, nobody (including you) will ever be able to access it again. Are you sure you want
                to continue?
              </Trans>
            )}
          </Alert>
        }
        confirmTitle={<Trans>Burn</Trans>}
      />
    );

    if (!confirmation) {
      return;
    }

    try {
      const feeInMojos = chiaToMojo(fee || 0);

      await transferNFT({
        walletId: nfts[0].walletId,
        nftCoinIds: nfts.map((nft: NFTInfo) => nft.nftCoinId),
        targetAddress: destination,
        fee: feeInMojos,
      }).unwrap();

      filter.setSelectedNFTIds([]);

      onClose();
    } catch (error) {
      showError(error);
    }
  }

  function renderNFTPreview() {
    if (nfts.length === 1) {
      return (
        <Flex flexDirection="column" gap={1}>
          <NFTSummary launcherId={nfts[0].launcherId} />
        </Flex>
      );
    }
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth {...rest}>
      <DialogTitle id="nft-transfer-dialog-title">
        <Flex flexDirection="row" gap={1}>
          <Typography variant="h6">
            {nfts.length > 1 ? (
              <Trans id="Do you want to burn {count} NFTs?" values={{ count: nfts.length }} />
            ) : (
              <Trans>Do you want to burn this NFT?</Trans>
            )}
          </Typography>
        </Flex>
      </DialogTitle>
      <DialogContent>
        <Form methods={methods} onSubmit={handleSubmit}>
          <Flex flexDirection="column" gap={3}>
            <DialogContentText id="nft-transfer-dialog-description">
              <Trans>
                Burning a non-fungible token means removing it from circulation by sending it to a verifiably
                un-spendable address. However, transactions leading up to the burn will remain on the blockchain ledger.
              </Trans>
            </DialogContentText>

            <Flex flexDirection="column" gap={3}>
              {renderNFTPreview()}
              <TextField
                name="destination"
                variant="filled"
                color="secondary"
                InputProps={{
                  readOnly: true,
                }}
                fullWidth
                label={<Trans>Send to Address</Trans>}
              />
              <EstimatedFee
                id="filled-secondary"
                variant="filled"
                name="fee"
                color="secondary"
                label={<Trans>Fee</Trans>}
                disabled={isSubmitting}
                txType={FeeTxType.transferNFT}
                fullWidth
              />
              <DialogActions>
                <Flex flexDirection="row" gap={2}>
                  <Button onClick={handleClose} color="secondary" variant="outlined" autoFocus>
                    <Trans>Cancel</Trans>
                  </Button>
                  <ButtonLoading
                    type="submit"
                    autoFocus
                    color="danger"
                    variant="contained"
                    loading={isSubmitting}
                    disableElevation
                  >
                    <Trans>Burn</Trans>
                  </ButtonLoading>
                </Flex>
              </DialogActions>
            </Flex>
          </Flex>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from 'react';
import { Trans } from '@lingui/macro';
import {
  Button,
  ButtonLoading,
  ConfirmDialog,
  Fee,
  Form,
  Flex,
  TextField,
  useOpenDialog,
} from '@chia/core';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';

type NFTTransferFormData = {
  destinationDID: string;
  fee: string;
};

type NFTTransferActionProps = {
  nftAssetId: string;
  destinationDID?: string;
  onComplete?: (success: boolean) => void;
};

export default function NFTTransferAction(props: NFTTransferActionProps) {
  const { nftAssetId, destinationDID, onComplete } = props;
  const [isLoading, setIsLoading] = useState(false);
  const openDialog = useOpenDialog();
  const methods = useForm<NFTTransferFormData>({
    shouldUnregister: false,
    defaultValues: {
      destinationDID: destinationDID || '',
      fee: '',
    },
  });

  async function handleClose() {
    console.log('handleClose called in NFTs');
    if (onComplete) {
      onComplete(false);
    }
  }

  async function handleSubmit(formData: NFTTransferFormData) {
    const { destinationDID } = formData;
    let isValid = true;
    let confirmation = false;
    console.log('handleSubmit called in NFTTransferAction');
    console.log(formData);

    if (isValid) {
      confirmation = await openDialog(
        <ConfirmDialog
          title={<Trans>Confirm NFT Transfer</Trans>}
          confirmTitle={<Trans>Transfer</Trans>}
          confirmColor="secondary"
          cancelTitle={<Trans>Cancel</Trans>}
        >
          <Trans>
            Once you initiate this transfer, you will not be able to cancel the
            transaction. Are you sure you want to transfer the NFT?
          </Trans>
        </ConfirmDialog>
      );
    }

    if (confirmation) {
      setIsLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 5000));

      setIsLoading(false);

      if (onComplete) {
        onComplete(true);
      }
    }
  }

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex flexDirection="column" gap={3}>
        <Trans>NFT Asset ID:</Trans>
        <Typography variant="body1">{nftAssetId}</Typography>
        <TextField
          name="destinationDID"
          variant="filled"
          color="secondary"
          fullWidth
          label={<Trans>Send to Address / Puzzle hash</Trans>}
          disabled={isLoading}
          required
        />
        <Fee
          id="filled-secondary"
          variant="filled"
          name="fee"
          color="secondary"
          label={<Trans>Fee</Trans>}
          disabled={isLoading}
        />
        <DialogActions>
          <Flex flexDirection="row" gap={3}>
            <Button
              onClick={handleClose}
              color="secondary"
              variant="outlined"
              autoFocus
            >
              <Trans>Close</Trans>
            </Button>
            <ButtonLoading
              type="submit"
              autoFocus
              color="primary"
              variant="contained"
              loading={isLoading}
            >
              <Trans>Transfer</Trans>
            </ButtonLoading>
          </Flex>
        </DialogActions>
      </Flex>
    </Form>
  );
}

type NFTTransferDialogProps = {
  open: boolean;
  onClose: (value: any) => void;
  onComplete?: (success: boolean) => void;
  nftAssetId: string;
  destinationDID?: string;
};

export function NFTTransferDialog(props: NFTTransferDialogProps) {
  const { open, onClose, onComplete, nftAssetId, destinationDID, ...rest } =
    props;

  function handleClose() {
    console.log('handleClose called in NFTTransferDialog');
    onClose(false);
  }

  function handleCompletion(success: boolean) {
    console.log('handleCompletion called in NFTTransferDialog');
    onClose(success);
    if (onComplete) {
      onComplete(success);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="nft-transfer-dialog-title"
      aria-describedby="nft-transfer-dialog-description"
      maxWidth="sm"
      fullWidth
      {...rest}
    >
      <DialogTitle id="nft-transfer-dialog-title">
        <Trans>Transfer NFT</Trans>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="nft-transfer-dialog-description">
          <Trans>
            Would you like to transfer the specified NFT to a new owner? It is
            recommended that you include a fee to ensure that the transaction is
            completed in a timely manner.
          </Trans>
        </DialogContentText>
        <NFTTransferAction
          nftAssetId={nftAssetId}
          destinationDID={destinationDID}
          onComplete={handleCompletion}
        />
      </DialogContent>
    </Dialog>
  );
}

NFTTransferDialog.defaultProps = {
  open: false,
  onClose: () => {},
};

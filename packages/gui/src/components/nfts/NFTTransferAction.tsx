import type { NFTInfo } from '@chia-network/api';
import { useTransferNFTMutation } from '@chia-network/api-react';
import {
  Button,
  ButtonLoading,
  EstimatedFee,
  FeeTxType,
  Form,
  Flex,
  chiaToMojo,
  useCurrencyCode,
  validAddress,
  useShowError,
} from '@chia-network/core';
import { AddressBookAutocomplete } from '@chia-network/wallets';
import { Trans } from '@lingui/macro';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';

import NFTSummary from './NFTSummary';

/* ========================================================================== */
/*                              NFTTransferResult                             */
/* ========================================================================== */

export type NFTTransferResult = {
  transferInfo?: {
    nftAssetId: string;
    destination: string;
    fee: string;
  };
  error?: string;
};

/* ========================================================================== */
/*                      NFT Transfer Confirmation Dialog                      */
/* ========================================================================== */

/* ========================================================================== */
/*                         NFT Transfer Action (Form)                         */
/* ========================================================================== */

type NFTTransferFormData = {
  destination: string;
  fee: string;
};

type NFTTransferActionProps = {
  nfts: NFTInfo[];
  destination?: string;
  onComplete?: (result?: NFTTransferResult) => void;
};

export default function NFTTransferAction(props: NFTTransferActionProps) {
  const { nfts, destination = '', onComplete } = props;

  const [transferNFT, { isLoading: isTransferNFTLoading }] = useTransferNFTMutation();
  const showError = useShowError();
  const currencyCode = useCurrencyCode();
  const methods = useForm<NFTTransferFormData>({
    shouldUnregister: false,
    defaultValues: {
      destination,
      fee: '',
    },
  });

  async function handleClose() {
    if (onComplete) {
      onComplete(); // No result provided if the user cancels out of the dialog
    }
  }

  async function handleSubmit(formData: NFTTransferFormData) {
    const { destination: destinationLocal, fee } = formData;
    const feeInMojos = chiaToMojo(fee || 0);

    try {
      if (!currencyCode) {
        throw new Error('Selected network address prefix is not defined');
      }
      validAddress(destinationLocal, [currencyCode.toLowerCase()]);
    } catch (error) {
      showError(error);
      return;
    }

    let success;
    let errorMessage;

    try {
      await transferNFT({
        walletId: nfts[0].walletId,
        nftCoinIds: nfts.map((nft: NFTInfo) => nft.nftCoinId),
        targetAddress: destinationLocal,
        fee: feeInMojos,
      }).unwrap();
      success = true;
      errorMessage = undefined;
    } catch (err: any) {
      success = false;
      errorMessage = err.message;
    }

    if (onComplete) {
      onComplete({
        success,
        error: errorMessage,
      });
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
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex flexDirection="column" gap={3}>
        {renderNFTPreview()}
        <AddressBookAutocomplete
          name="destination"
          getType="address"
          freeSolo
          variant="filled"
          required
          disabled={isTransferNFTLoading}
        />
        <EstimatedFee
          id="filled-secondary"
          variant="filled"
          name="fee"
          color="secondary"
          label={<Trans>Fee</Trans>}
          disabled={isTransferNFTLoading}
          txType={FeeTxType.transferNFT}
          fullWidth
        />
        <DialogActions>
          <Flex flexDirection="row" gap={3}>
            <Button onClick={handleClose} color="secondary" variant="outlined" autoFocus>
              <Trans>Close</Trans>
            </Button>
            <ButtonLoading type="submit" autoFocus color="primary" variant="contained" loading={isTransferNFTLoading}>
              <Trans>Transfer</Trans>
            </ButtonLoading>
          </Flex>
        </DialogActions>
      </Flex>
    </Form>
  );
}

/* ========================================================================== */
/*                             NFT Transfer Dialog                            */
/* ========================================================================== */

type NFTTransferDialogProps = {
  open?: boolean;
  onClose?: (value: any) => void;
  onComplete?: (result?: NFTTransferResult) => void;
  nfts: NFTInfo[];
  destination?: string;
};

export function NFTTransferDialog(props: NFTTransferDialogProps) {
  const { open, onClose, onComplete, nfts, destination, ...rest } = props;

  function handleClose() {
    if (onClose) onClose(false);
  }

  function handleCompletion(result?: NFTTransferResult) {
    if (onClose) onClose(true);
    if (onComplete) {
      onComplete(result);
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
        <Flex flexDirection="row" gap={1}>
          <Typography variant="h6">
            <Trans>Transfer NFT</Trans>
          </Typography>
        </Flex>
      </DialogTitle>
      <DialogContent>
        <Flex flexDirection="column" gap={3}>
          <DialogContentText id="nft-transfer-dialog-description">
            {nfts.length > 1 ? (
              <Trans id="Would you like to transfer {count} NFTs to a new owner?" values={{ count: nfts.length }} />
            ) : (
              <Trans>Would you like to transfer the specified NFT to a new owner?</Trans>
            )}
          </DialogContentText>
          <NFTTransferAction nfts={nfts} destination={destination} onComplete={handleCompletion} />
        </Flex>
      </DialogContent>
    </Dialog>
  );
}

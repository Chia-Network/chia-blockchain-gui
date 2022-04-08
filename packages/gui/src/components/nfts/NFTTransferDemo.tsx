import React from 'react';
import { Trans } from '@lingui/macro';
import { Flex, Form, TextField, useOpenDialog } from '@chia/core';
import { Button, Grid } from '@mui/material';
import { useForm } from 'react-hook-form';
import { NFTTransferDialog } from './NFTTransferAction';

type NFTTransferDemoFormData = {
  nftAssetId: string;
  destinationDID?: string;
};

export default function NFTTransferDemo() {
  const openDialog = useOpenDialog();
  const methods = useForm<NFTTransferDemoFormData>({
    shouldUnregister: false,
    defaultValues: {
      nftAssetId: '',
      destinationDID: '',
    },
  });

  async function handleClose() {
    console.log('handleClose called in NFTs');
  }

  // async function handleTransferNFT() {
  //   const result = await openDialog(<NFTTransferDialog />);

  //   console.log('handleTransferNFT result:');
  //   console.log(result);
  // }

  async function handleInitiateTransfer(formData: NFTTransferDemoFormData) {
    const { nftAssetId, destinationDID } = formData;
    console.log('handleInitiateTransfer called in NFTs');
    console.log(formData);

    const result = await openDialog(
      <NFTTransferDialog
        nftAssetId={nftAssetId}
        destinationDID={destinationDID}
      />
    );

    console.log('handleInitiateTransfer result:');
    console.log(result);
  }

  return (
    <Form methods={methods} onSubmit={handleInitiateTransfer}>
      <Grid container>
        <Grid lg={3} item>
          <Flex flexDirection="column" gap={3}>
            <Button type="submit" variant="contained" color="primary">
              <Trans>Transfer NFT</Trans>
            </Button>
            <TextField
              name="nftAssetId"
              variant="outlined"
              label="NFT Coin Info"
              required
            />
            <TextField
              name="destinationDID"
              variant="outlined"
              label="Destination DID Address (optional)"
            />
          </Flex>
        </Grid>
      </Grid>
    </Form>
  );
}

import { AlertDialog, Fee, Back, ButtonLoading, Card, Flex, Form, TextField , chiaToMojo } from '@chia/core';
import { Trans } from '@lingui/macro';
import { Box, Grid } from '@mui/material';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

import config from '../../../config/config';
import { openDialog } from '../../../modules/dialog';
import { create_cc_for_colour_action } from '../../../modules/message';

const { asteroid } = config;

type CreateExistingCATWalletData = {
  name: string;
  fee: string;
};

export default function WalletCATCreateExisting() {
  const methods = useForm<CreateExistingCATWalletData>({
    defaultValues: {
      name: '',
      fee: '',
    },
  });
  const [loading, setLoading] = useState<boolean>(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleSubmit(values: CreateExistingCATWalletData) {
    try {
      const { name, fee } = values;
      setLoading(true);

      if (!name) {
        dispatch(
          openDialog(
            <AlertDialog>
              <Trans>Please enter a valid CAT name</Trans>
            </AlertDialog>,
          ),
        );
        return;
      }

      /* FEE is optional
      if (fee === '' || isNaN(Number(fee))) {
        dispatch(
          openDialog(
            <AlertDialog>
              <Trans>Please enter a valid numeric fee</Trans>
            </AlertDialog>,
          ),
        );
        return;
      } */

      const feeMojos = chiaToMojo(fee || '0');

      const response = await dispatch(create_cc_for_colour_action(name, feeMojos));
      if (response && response.data && response.data.success === true) {
        navigate(`/dashboard/wallets/${response.data.wallet_id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex flexDirection="column" gap={3}>
        <Back variant="h5">
          {asteroid 
            ? <Trans>Create custom CAT Wallet</Trans>
            : <Trans>Create Chia Asset Token Wallet from Existing TAIL</Trans>}
          
        </Back>
        <Card>
          <Grid spacing={2} container>
            <Grid xs={12} md={6} item>
              <TextField
                name="name"
                variant="outlined"
                label={<Trans>Token and Asset Issuance Limitations</Trans>}
                fullWidth
              />
            </Grid>
            <Grid xs={12} md={6} item>
              <Fee
                variant="outlined"
                fullWidth
              />
            </Grid>
          </Grid>
        </Card>
        <Box>
          <ButtonLoading
            type="submit"
            variant="contained"
            color="primary"
            loading={loading}
          >
            <Trans>Recover</Trans>
          </ButtonLoading>
        </Box>
      </Flex>
    </Form>
  );
}

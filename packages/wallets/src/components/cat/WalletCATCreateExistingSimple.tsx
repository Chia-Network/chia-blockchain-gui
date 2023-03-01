import { SyncingStatus } from '@chia-network/api';
import { useAddCATTokenMutation } from '@chia-network/api-react';
import { Back, ButtonLoading, Card, Flex, Form, TextField } from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import { Grid } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import useWalletState from '../../hooks/useWalletState';

type CreateExistingCATWalletData = {
  name: string;
  assetId: string;
  symbol?: string;
};

export default function WalletCATCreateExisting() {
  const methods = useForm<CreateExistingCATWalletData>({
    defaultValues: {
      assetId: '',
      name: '',
      symbol: '',
    },
  });
  const navigate = useNavigate();
  const [addCATToken, { isLoading: isAddCATTokenLoading }] = useAddCATTokenMutation();
  const { state } = useWalletState();

  async function handleSubmit(values: CreateExistingCATWalletData) {
    const { name, assetId } = values;

    if (isAddCATTokenLoading) {
      return;
    }

    if (state !== SyncingStatus.SYNCED) {
      throw new Error(t`Please wait for wallet synchronization`);
    }

    if (!assetId) {
      throw new Error(t`Please enter a valid asset id`);
    }

    if (!name) {
      throw new Error(t`Please enter a valid token name`);
    }

    const walletId = await addCATToken({
      name,
      assetId,
    }).unwrap();

    navigate(`/dashboard/wallets/${walletId}`);
  }

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex flexDirection="column" gap={3}>
        <Back variant="h5">
          <Trans>Add Token</Trans>
        </Back>
        <Card>
          <Grid spacing={2} direction="column" container>
            <Grid xs={12} md={8} lg={6} item>
              <Grid spacing={2} container>
                <Grid xs={12} item>
                  <TextField name="name" variant="outlined" label={<Trans>Name</Trans>} fullWidth autoFocus />
                </Grid>
                <Grid xs={12} item>
                  <TextField name="assetId" variant="outlined" label={<Trans>Asset Id</Trans>} multiline fullWidth />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Card>
        <Flex justifyContent="flex-end">
          <ButtonLoading type="submit" variant="contained" color="primary" loading={isAddCATTokenLoading}>
            <Trans>Add</Trans>
          </ButtonLoading>
        </Flex>
      </Flex>
    </Form>
  );
}

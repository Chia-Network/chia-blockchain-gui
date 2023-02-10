import { TextField, ButtonLoading, Card, Flex, Form, useAddressBook } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography, Grid } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

export default function AddAddress() {
  const methods = useForm<AddAddressData>({
    defaultValues: {
      address: '',
      friendlyname: '',
    },
  });
  const navigate = useNavigate();

  const [s, add] = useAddressBook();
  async function handleSubmit(formData: AddAddressData) {
    add(formData.friendlyname, formData.address);
    navigate('/dashboard/addressbook');
  }

  return (
    <Flex flexDirection="column" gap={4} alignItems="stretch">
      <Flex gap={4} flexDirection="column">
        <Flex flexDirection="column" gap={1}>
          <Typography variant="h5">
            <Trans>Add Address</Trans>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <Trans>Address book is a way of managing addresses using a friendly name.</Trans>
          </Typography>
        </Flex>
      </Flex>

      <Card>
        <Form methods={methods} onSubmit={handleSubmit}>
          <Grid spacing={2} container>
            <Grid xs={12} item>
              <TextField
                name="address"
                variant="filled"
                color="secondary"
                fullWidth
                label={<Trans>Address / Puzzle hash</Trans>}
                data-testid="address"
                InputProps={{
                  readOnly: false,
                }}
                required
              />
            </Grid>
            <Grid xs={12} item>
              <TextField
                name="friendlyname"
                variant="filled"
                color="secondary"
                fullWidth
                label={<Trans>Friendly name</Trans>}
                data-testid="friendlyname"
                required
                InputProps={{
                  readOnly: false,
                }}
              />
            </Grid>

            <Grid xs={12} item>
              <Flex justifyContent="flex-end">
                <ButtonLoading type="submit" variant="contained" color="primary" loading={false}>
                  <Trans>Save</Trans>
                </ButtonLoading>
              </Flex>
            </Grid>
          </Grid>
        </Form>
      </Card>
    </Flex>
  );
}

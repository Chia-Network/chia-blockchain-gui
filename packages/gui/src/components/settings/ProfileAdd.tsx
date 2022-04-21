import React from 'react';
import { Trans, t } from '@lingui/macro';
import {
  Button,
  ButtonLoading,
  Flex,
  Form,
} from '@chia/core';
import {
  Card,
  CardContent,
  IconButton,
  Typography,
} from '@mui/material';
import styled from 'styled-components';
import { Add } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import {
  useCreateNewWalletMutation,
} from '@chia/api-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import useWalletState from '../../hooks/useWalletState';
import { SyncingStatus } from '@chia/api';

const StyledCard = styled(Card)(({ theme }) => `
  width: 100%;
  border-radius: ${theme.spacing(1)};
  border: 1px solid ${theme.palette.divider};
  background-color: ${theme.palette.background.paper};
  margin-bottom: ${theme.spacing(1)};
`);

const StyledCardContent = styled(CardContent)(({ theme }) => `
  padding-bottom: ${theme.spacing(2)} !important;
`);

type CreateProfileData = {
  walletType: string;
  did_type: 'new',
  backup_dids: [],
  num_of_backup_ids_needed: '0',
  amount: int;
  fee: string;
};

export default function ProfileAdd() {
  const methods = useForm<CreateProfileData>({
    defaultValues: {
      walletType: 'did_wallet',
      did_type: 'new',
      backup_dids: [],
      num_of_backup_ids_needed: '0',
      amount: 1,
      fee: '',
    },
  });

  const [createProfile, { isLoading: isCreateProfileLoading }] = useCreateNewWalletMutation();
  const navigate = useNavigate();
  // const { state } = useWalletState();

  async function handleSubmit(values: CreateProfileData) {
    const { amount, fee } = values;

    if (isCreateProfileLoading) {
      return;
    }

    const walletId = await createProfile({
      walletType: 'did_wallet',
      options: {did_type: 'new', backup_dids: [], num_of_backup_ids_needed: '0', amount: 1, fee: '0'},
    }).unwrap();

    navigate(`/dashboard/settings/profiles/${walletId}`);
  }

  return (
    <div style={{width:"70%"}}>
      <Form methods={methods} onSubmit={handleSubmit}>
        <Flex flexDirection="column" gap={2.5} paddingBottom={3}>
          <Typography variant="h6">
            <Trans>Create a new profile</Trans>
          </Typography>
        </Flex>
        <Flex flexDirection="column" gap={2.5} paddingBottom={1}>
          <Trans><strong>Get some XCH</strong></Trans>
        </Flex>
        <Flex paddingBottom={3}>
          <StyledCard variant="outlined">
            <StyledCardContent>
              <Flex flexDirection="column" height="100%" width="100%">
                <IconButton>
                  <Add />
                  <Typography paddingLeft={1}>get some Mojos from the Chia Faucet</Typography>
                </IconButton>
              </Flex>
            </StyledCardContent>
          </StyledCard>
        </Flex>
        <Flex flexDirection="column" gap={2.5} paddingBottom={1}>
          <Trans><strong>Use one (1) mojo to create a Profile.</strong></Trans>
        </Flex>
        <Flex justifyContent="flex-end">
          <ButtonLoading
            type="submit"
            variant="contained"
            color="primary"
            loading={isCreateProfileLoading}
          >
            <Trans>Create</Trans>
          </ButtonLoading>
        </Flex>
      </Form>
    </div>
  );
}

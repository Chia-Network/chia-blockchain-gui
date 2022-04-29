import React, { useMemo } from 'react';
import { Trans, t } from '@lingui/macro';
import {
  Button,
  ButtonLoading,
  Flex,
  Form,
  mojoToChiaLocaleString,
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
  useGetWalletBalanceQuery,
} from '@chia/api-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import {
  SyncingStatus,
  WalletType,
  type Wallet,
 } from '@chia/api';
import useOpenExternal from '../../hooks/useOpenExternal';

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
  const { data: balance, isLoading: isLoadingWalletBalance } = useGetWalletBalanceQuery({
    walletId: 1,
  });
  const navigate = useNavigate();
  const openExternal = useOpenExternal();

  function handleClick() {
    openExternal('https://faucet.chia.net/');
  }

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

  const standardBalance = mojoToChiaLocaleString(balance?.confirmedWalletBalance);

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
        <div style={{cursor: "pointer"}}>
          <Flex paddingBottom={3}>
            <Typography onClick={handleClick} paddingLeft={1} sx={{ textDecoration: "underline" }}>Get Mojos from the Chia Faucet</Typography>
          </Flex>
        </div>
        <Flex flexDirection="column" gap={2.5} paddingBottom={1}>
          <Trans><strong>Use one (1) mojo to create a Profile.</strong></Trans>
        </Flex>
        <Flex flexDirection="column" gap={2.5} paddingBottom={1}>
          <Typography variant="caption">
            <Trans>Balance: {standardBalance} XCH</Trans>
          </Typography>
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

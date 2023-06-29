import {
  useCreateNewWalletMutation,
  useGetCurrentAddressQuery,
  useGetWalletBalanceQuery,
} from '@chia-network/api-react';
import {
  ButtonLoading,
  EstimatedFee,
  FeeTxType,
  Flex,
  Form,
  Link,
  TextField,
  chiaToMojo,
  mojoToChiaLocaleString,
  useCurrencyCode,
} from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import { Card, Typography } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import isNumeric from 'validator/es/lib/isNumeric';

import useOpenExternal from '../../hooks/useOpenExternal';

const StyledCard = styled(Card)(
  ({ theme }) => `
  width: 100%;
  padding: ${theme.spacing(3)};
  border-radius: ${theme.spacing(1)};
  background-color: ${theme.palette.background.paper};
`
);

type CreateProfileData = {
  backup_dids: [];
  num_of_backup_ids_needed: '0';
  name?: string;
  amount: number;
  fee: string;
};

export default function ProfileAdd() {
  const methods = useForm<CreateProfileData>({
    defaultValues: {
      backup_dids: [],
      num_of_backup_ids_needed: '0',
      name: '',
      amount: 1,
      fee: '',
    },
  });

  const currencyCode = (useCurrencyCode() ?? 'XCH').toUpperCase();
  const isTestnet = currencyCode === 'TXCH';
  const { data: currentAddress } = useGetCurrentAddressQuery({
    walletId: 1,
  });
  const [createProfile, { isLoading: isCreateProfileLoading }] = useCreateNewWalletMutation();
  const { data: balance } = useGetWalletBalanceQuery({
    walletId: 1,
  });
  const navigate = useNavigate();
  const openExternal = useOpenExternal();
  const spendableBalance = mojoToChiaLocaleString(balance?.spendableBalance);
  const canCreateProfile = (balance?.spendableBalance ?? 0) > 0;

  function handleClick() {
    const url = `https://${isTestnet ? 'testnet10-faucet.chia.net' : 'faucet.chia.net'}/?address=${currentAddress}`;
    openExternal(url);
  }

  async function handleSubmit(data: CreateProfileData) {
    if (!canCreateProfile) {
      throw new Error(t`Your spendable balance must be greater than 1 mojo to create a profile`);
    }

    const fee = data.fee.trim() || '0';
    if (!isNumeric(fee)) {
      throw new Error(t`Please enter a valid numeric fee`);
    }

    if (isCreateProfileLoading) {
      return;
    }

    let walletName = data.name?.trim();
    if (walletName?.length === 0) {
      walletName = undefined;
    }

    const walletId = await createProfile({
      walletType: 'did_wallet',
      options: {
        did_type: 'new',
        backup_dids: [],
        num_of_backup_ids_needed: '0',
        amount: 1,
        fee: chiaToMojo(fee),
        walletName,
      },
    }).unwrap();

    navigate(`/dashboard/settings/profiles/${walletId}`);
  }

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex flexDirection="column" flexGrow={1} marginTop={-0.5}>
        <Typography variant="h6">
          <Trans>Create a new profile</Trans>
        </Typography>
        <StyledCard sx={{ marginTop: '22px' }}>
          <Flex flexDirection="column" gap={2}>
            <Flex flexDirection="column" gap={2}>
              {!canCreateProfile && (
                <Flex flexDirection="column" gap={1}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    <Trans>Need some {currencyCode}?</Trans>
                  </Typography>
                  <Link onClick={handleClick}>
                    <Trans>Get Mojos from the Chia Faucet</Trans>
                  </Link>
                </Flex>
              )}
              <Flex flexDirection="column" gap={1}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  <Trans>Creating a profile requires 1 mojo</Trans>
                </Typography>
                <Typography variant="caption">
                  <Trans>
                    Spendable Balance: {spendableBalance} {currencyCode}
                  </Trans>
                </Typography>
              </Flex>
            </Flex>
            <TextField
              name="name"
              variant="outlined"
              label={<Trans>Profile Name (Optional)</Trans>}
              fullWidth
              autoFocus
            />
            <Flex flexDirection="column" gap={2.5} paddingBottom={1}>
              <EstimatedFee
                id="filled-secondary"
                variant="filled"
                name="fee"
                color="secondary"
                label={<Trans>Fee</Trans>}
                fullWidth
                txType={FeeTxType.createDID}
              />
            </Flex>
            <Flex justifyContent="flex-end">
              <ButtonLoading type="submit" variant="contained" color="primary" loading={isCreateProfileLoading}>
                <Trans>Create</Trans>
              </ButtonLoading>
            </Flex>
          </Flex>
        </StyledCard>
      </Flex>
    </Form>
  );
}

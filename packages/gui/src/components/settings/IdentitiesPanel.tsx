import React, { useMemo, type ReactNode } from 'react';
import { Trans } from '@lingui/macro';
import { type Shell } from 'electron';
import { useNavigate, useParams } from 'react-router';
import {
  Button,
  CardListItem,
  Flex,
  Link,
} from '@chia/core';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from '@mui/material';
import styled from 'styled-components';
import { orderBy } from 'lodash';

import { useGetWalletsQuery } from '@chia/api-react';
import { WalletType, type Wallet } from '@chia/api';

const StyledRoot = styled(Box)`
  min-width: 390px;
  height: 100%;
  display: flex;
  padding-top: ${({ theme }) => `${theme.spacing(3)}`};
`;

const StyledBody = styled(Box)`
  flex-grow: 1;
  position: relative;
`;

const StyledItemsContainer = styled(Box)`
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: ${({ theme }) => theme.spacing(11)};
`;

const StyledContent = styled(Box)`
  padding-left: ${({ theme }) => theme.spacing(0)};
  padding-right: ${({ theme }) => theme.spacing(4)};
  min-height: ${({ theme }) => theme.spacing(5)};
`;

const StyledCard = styled(Card)(({ theme }) => `
  width: 100%;
  border-radius: ${theme.spacing(1)};
  border: 1px dashed ${theme.palette.divider};
  background-color: ${theme.palette.background.paper};
  margin-bottom: ${theme.spacing(1)};
`);

const StyledCardContent = styled(CardContent)(({ theme }) => `
  padding-bottom: ${theme.spacing(2)} !important;
`);

export default function IdentitiesPanel() {
  const navigate = useNavigate();
  const { walletId } = useParams();
  const { data: wallets, isLoading } = useGetWalletsQuery();

  function handleSelectWallet(walletId: number) {
    navigate(`/dashboard/settings/profiles/${walletId}`);
  }

  const didList = useMemo(() => {
    let dids = [];
    if (wallets) {
      wallets.forEach((wallet) => {
        if (wallet.type === WalletType.DISTRIBUTED_ID) {
          console.log(wallet.data);
          dids.push(wallet.id);
        }
      });
    }
    return dids;
  }, [wallets]);

  const items = useMemo(() => {
    if (isLoading) {
      return [];
    }

    let didLength = didList.length

    if (didLength == 0) {
      return (
        <StyledCard variant="outlined">
          <StyledCardContent>
            <Flex flexDirection="column" height="100%" width="100%">
              <Typography>No Profiles</Typography>
            </Flex>
          </StyledCardContent>
        </StyledCard>
      )
    } else {
      const orderedProfiles = orderBy(wallets, ['name'], ['asc']);

      return orderedProfiles
        .filter(wallet => [WalletType.DISTRIBUTED_ID].includes(wallet.type))
        .map((wallet) => {
          const primaryTitle = wallet.name;

          function handleSelect() {
            handleSelectWallet(wallet.id);
          }

          return (
            <CardListItem onSelect={handleSelect} key={wallet.id} selected={wallet.id === Number(walletId)}>
              <Flex flexDirection="column" height="100%" width="100%">
                <Typography><strong>[*Wallet Name* / {primaryTitle}]</strong></Typography>
                <Typography>[*DID ID*]</Typography>
              </Flex>
            </CardListItem>
          );
        });
    }
  }, [wallets, walletId, isLoading]);

  return (
    <StyledRoot>
      <Flex gap={3} flexDirection="column" width="100%">
        <StyledBody>
          <StyledItemsContainer>
            <StyledContent>
              <Flex gap={1} flexDirection="column" height="100%" width="100%">
                {items}
              </Flex>
            </StyledContent>
          </StyledItemsContainer>
        </StyledBody>
      </Flex>
    </StyledRoot>
  );
}

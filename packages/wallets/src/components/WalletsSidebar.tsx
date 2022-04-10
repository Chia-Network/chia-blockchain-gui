import React, { useMemo } from 'react';
import { Trans } from '@lingui/macro';
import { orderBy } from 'lodash';
import { useNavigate, useParams } from 'react-router';
import { Box, Typography } from '@mui/material';
import { Flex, CardListItem } from '@chia/core';
import { useGetWalletsQuery } from '@chia/api-react';
import { WalletType } from '@chia/api';
import styled from 'styled-components';
import WalletIcon from './WalletIcon';
import getWalletPrimaryTitle from '../utils/getWalletPrimaryTitle';
import WalletsManageTokens from './WalletsManageTokens';
import useHiddenWallet from '../hooks/useHiddenWallet';

const StyledRoot = styled(Box)`
  min-width: 390px;
  height: 100%;
  display: flex;
  padding-top: ${({ theme }) => `${theme.spacing(3)}`};
`;

const StyledContent = styled(Box)`
  padding-left: ${({ theme }) => theme.spacing(4)};
  padding-right: ${({ theme }) => theme.spacing(4)};
  min-height: ${({ theme }) => theme.spacing(5)};
`;

const StyledBody = styled(Box)`
  flex-grow: 1;
  position: relative;
`;

const StyledItemsContainer = styled(Box)`
  overflow: auto;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: ${({ theme }) => theme.spacing(11)};
`;

export default function WalletsSidebar() {
  const navigate = useNavigate();
  const { walletId } = useParams();
  const { data: wallets, isLoading } = useGetWalletsQuery();
  const { isHidden, hidden } = useHiddenWallet();

  function handleSelectWallet(walletId: number) {
    navigate(`/dashboard/wallets/${walletId}`);
  }

  const items = useMemo(() => {
    if (isLoading) {
      return [];
    }

    const orderedWallets = orderBy(wallets, ['type', 'name'], ['asc', 'asc']);

    return orderedWallets
      .filter(wallet => ![WalletType.POOLING_WALLET].includes(wallet.type) && !isHidden(wallet.id))
      .map((wallet) => {
        const primaryTitle = getWalletPrimaryTitle(wallet);

        function handleSelect() {
          handleSelectWallet(wallet.id);
        }

        return (
          <CardListItem onSelect={handleSelect} key={wallet.id} selected={wallet.id === Number(walletId)}>
            <Flex flexDirection="column">
              <Typography>{primaryTitle}</Typography>
              <WalletIcon wallet={wallet} color="textSecondary" variant="caption" />
            </Flex>
          </CardListItem>
        );
      });
  }, [wallets, walletId, isLoading, hidden]);

  return (
    <StyledRoot>
      <Flex gap={3} flexDirection="column" width="100%">
        <StyledContent>
          <Typography variant="h5">
            <Trans>Tokens</Trans>
          </Typography>
        </StyledContent>
        <StyledBody>
          <StyledItemsContainer>
            <StyledContent>
              <Flex gap={1} flexDirection="column">
                {items}
              </Flex>
            </StyledContent>
          </StyledItemsContainer>
          <WalletsManageTokens />
        </StyledBody>
      </Flex>
    </StyledRoot>
  );
}

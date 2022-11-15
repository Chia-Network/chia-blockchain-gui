import { Back, Flex, FormatLargeNumber, Loading, Logo } from '@chia/core';
import { Trans } from '@lingui/macro';
import {
  ChevronRight as ChevronRightIcon,
  EnergySavingsLeaf as EcoIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import React from 'react';
import { useSelector } from 'react-redux';

import LayoutHero from '../../layout/LayoutHero';
import config from '../../../config/config';
import { Switch, Route, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import WalletName from '../../../constants/WalletName';
import WalletType from '../../../constants/WalletType';
import useTrans from '../../../hooks/useTrans';
import type { RootState } from '../../../modules/rootReducer';
import LayoutMain from '../../layout/LayoutMain';
import WalletsList from '../WalletsList';
import WalletCAT from '../cat/WalletCAT';
import { CreateWalletView } from '../create/WalletCreate';
import DistributedWallet from '../did/WalletDID';
import RateLimitedWallet from '../rateLimited/WalletRateLimited';
import StandardWallet from '../standard/WalletStandard';
import WalletHeroLayout from './WalletHeroLayout';

const StyledListItem = styled(ListItem)`
  min-width: 300px;
`;

const { multipleWallets, asteroid } = config;

export default function Wallets() {
  const navigate = useNavigate();
  const { walletId } = useParams();
  const trans = useTrans();
  const wallets = useSelector((state: RootState) => state.wallet_state.wallets);
  const loading = !wallets;

  function handleChange(_, newValue) {
    if (asteroid && newValue === 'create') {
      navigate('/dashboard/wallets/create/simple');
      return;
    }

    navigate(`/dashboard/wallets/${newValue}`);
  }

  function handleAddCustomToken() {
    navigate(`/wallets/add`);
  }

  return (
    <WalletHeroLayout title={<Trans>Add Token</Trans>}>
      {!wallets ? (
        <Loading center />
      ) : (
        <Card>
          <List>
            {/* catList?.map((token: Wallet) => (
              <StyledListItem
                onClick={() => handleChange(null, token)}
                key={token.name}
                button
              >
                <Flex flexGrow={1} alignItems="center">
                  <Flex flexGrow={1} gap={3} alignItems="center">
                    <token.icon width={32} />

                    <ListItemText
                      primary={token.name}
                    />
                  </Flex>

                  <ChevronRightIcon />
                </Flex>
              </StyledListItem>
            )) */}
          </List>
        </Card>
      )}
      <Button
        onClick={handleAddCustomToken}
        variant="outlined"
        size="large"
        fullWidth
      >
        <Trans>Add Custom Token</Trans>
      </Button>
    </WalletHeroLayout>
  );
}

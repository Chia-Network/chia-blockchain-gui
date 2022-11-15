import { Back, Flex, FormatLargeNumber, Loading, Logo } from '@chia/core';
import { Trans } from '@lingui/macro';
import {
  ChevronRight as ChevronRightIcon,
  EnergySavingsLeaf as EcoIcon,
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
import styled from 'styled-components';

import config from '../../../config/config';
import WalletName from '../../../constants/WalletName';
import WalletType from '../../../constants/WalletType';
import useTrans from '../../../hooks/useTrans';
import type { RootState } from '../../../modules/rootReducer';
import LayoutHero from '../../layout/LayoutHero';
import LayoutMain from '../../layout/LayoutMain';
import WalletsList from '../WalletsList';
import WalletCAT from '../cat/WalletCAT';
import { CreateWalletView } from '../create/WalletCreate';
import DistributedWallet from '../did/WalletDID';
import RateLimitedWallet from '../rateLimited/WalletRateLimited';
import StandardWallet from '../standard/WalletStandard';
import WalletHeroAdd from './WalletHeroAdd';
import WalletHeroWallets from './WalletHeroWallets';

const StyledListItem = styled(ListItem)`
  min-width: 300px;
`;

const { multipleWallets, asteroid } = config;

type Props = {
  title: ReactNode;
  children: ReactNode;
};

export default function Wallets(props: Props) {
  const { title, children } = props;
  const trans = useTrans();
  const wallets = useSelector((state: RootState) => state.wallet_state.wallets);
  const loading = !wallets;

  return (
    <LayoutHero>
      <Container maxWidth="xs">
        <Flex flexDirection="column" alignItems="center" gap={3}>
          <Logo width={130} />
          <Back to="/">
            <Typography variant="h5" component="h1">
              {title}
            </Typography>
          </Back>
          <Flex
            flexDirection="column"
            gap={3}
            alignItems="stretch"
            alignSelf="stretch"
          >
            {children}
          </Flex>
        </Flex>
      </Container>
    </LayoutHero>
  );
}

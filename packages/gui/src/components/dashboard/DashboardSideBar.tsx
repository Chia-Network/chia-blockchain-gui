import { useLocalStorage } from '@chia-network/api-react';
import { Color, Flex, SideBarItem } from '@chia-network/core';
import {
  Farm as FarmIcon,
  FullNode as FullNodeIcon,
  Harvest as HarvestIcon,
  Plots as PlotsIcon,
  Pooling as PoolingIcon,
  NFTs as NFTsIcon,
  Offers as OffersIcon,
  Tokens as TokensIcon,
  Settings as SettingsIcon,
  Contacts as AddressBookIcon,
  VC as VCIcon,
} from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { Box } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

const StyledItemsContainer = styled(Flex)`
  flex-direction: column;
  flex-grow: 1;
  overflow: auto;
  padding-top: ${({ theme }) => `${theme.spacing(5)}`};
`;

const StyledRoot = styled(Flex)`
  height: 100%;
  flex-direction: column;
`;

const StyledSideBarDivider = styled(Box)`
  height: 1px;
  background: ${({ theme }) => (theme.palette.mode === 'dark' ? Color.Neutral[700] : Color.Neutral[300])};
`;

const StyledSettingsContainer = styled(Box)`
  background-color: ${({ theme }) => theme.palette.background.paper};
`;

export type DashboardSideBarProps = {
  simple?: boolean;
};

export default function DashboardSideBar(props: DashboardSideBarProps) {
  const { simple = false } = props;
  const [enableVerifiableCredentials] = useLocalStorage<boolean>('enable-verifiable-credentials', true);

  return (
    <StyledRoot>
      <StyledItemsContainer>
        <SideBarItem
          to="/dashboard/wallets"
          icon={TokensIcon}
          title={<Trans>Tokens</Trans>}
          data-testid="DashboardSideBar-tokens"
        />
        <SideBarItem
          to="/dashboard/nfts"
          icon={NFTsIcon}
          title={<Trans>NFTs</Trans>}
          data-testid="DashboardSideBar-nfts"
        />
        {enableVerifiableCredentials && (
          <SideBarItem
            to="/dashboard/vc"
            icon={VCIcon}
            title={<Trans>Credentials</Trans>}
            data-testid="DashboardSideBar-vc"
          />
        )}
        <SideBarItem
          to="/dashboard/offers"
          icon={OffersIcon}
          title={<Trans>Offers</Trans>}
          data-testid="DashboardSideBar-offers"
        />
        <SideBarItem
          to="/dashboard/addressbook"
          icon={AddressBookIcon}
          title={<Trans>Contacts</Trans>}
          data-testid="DashboardSideBar-addressbook"
        />

        {!simple && (
          <>
            <Box my={1} mx={2}>
              <StyledSideBarDivider />
            </Box>

            <SideBarItem
              to="/dashboard"
              icon={FullNodeIcon}
              title={<Trans>Full Node</Trans>}
              data-testid="DashboardSideBar-fullnode"
              end
            />
            <SideBarItem
              to="/dashboard/farm"
              icon={FarmIcon}
              title={<Trans>Farm</Trans>}
              data-testid="DashboardSideBar-farming"
            />
            <SideBarItem
              to="/dashboard/plot"
              icon={PlotsIcon}
              title={<Trans>Plots</Trans>}
              data-testid="DashboardSideBar-plots"
            />
            <SideBarItem
              to="/dashboard/harvest"
              icon={HarvestIcon}
              title={<Trans>Harvest</Trans>}
              data-testid="DashboardSideBar-harvest"
            />
            {/* }
            <SideBarItem
              to="/dashboard/wallets"
              icon={<WalletIcon fontSize="large" />}
              title={<Trans>Wallets</Trans>}
            />
            */}
            <SideBarItem
              to="/dashboard/pool"
              icon={PoolingIcon}
              title={<Trans>Pooling</Trans>}
              data-testid="DashboardSideBar-pooling"
            />
          </>
        )}
      </StyledItemsContainer>
      <StyledSettingsContainer>
        <SideBarItem
          to="/dashboard/settings/general"
          icon={SettingsIcon}
          title={<Trans>Settings</Trans>}
          data-testid="DashboardSideBar-settings"
        />
      </StyledSettingsContainer>
    </StyledRoot>
  );
}

import { useLocalStorage } from '@chia-network/api-react';
import { Flex, SideBarItem, ScrollbarFlex } from '@chia-network/core';
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

const StyledItemsContainer = styled(ScrollbarFlex)`
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
`;

const StyledSideBarDivider = styled(Box)`
  height: 1px;
  background: radial-gradient(36.59% 100.8% at 50% 50%, rgba(0, 0, 0, 0.18) 99.54%, rgba(255, 255, 255, 0) 100%);
`;

export type DashboardSideBarProps = {
  simple?: boolean;
};

export default function DashboardSideBar(props: DashboardSideBarProps) {
  const { simple = false } = props;
  const [enableVerifiableCredentials] = useLocalStorage<boolean>('enable-verifiable-credentials', true);

  return (
    <Flex height="100%" flexDirection="column">
      <StyledItemsContainer>
        <Flex flexDirection="column" alignItems="center" paddingTop={5}>
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
              <Box my={1}>
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
        </Flex>
      </StyledItemsContainer>
      <Box>
        <SideBarItem
          to="/dashboard/settings/general"
          icon={SettingsIcon}
          title={<Trans>Settings</Trans>}
          data-testid="DashboardSideBar-settings"
        />
      </Box>
    </Flex>
  );
}

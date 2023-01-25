import { Flex, LayoutDashboardSub } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography, Tab, Tabs } from '@mui/material';
import React from 'react';
import { Routes, Route, matchPath, useLocation, useNavigate } from 'react-router-dom';

import SettingsAdvanced from './SettingsAdvanced';
import SettingsDataLayer from './SettingsDataLayer';
import SettingsGeneral from './SettingsGeneral';
import SettingsIntegration from './SettingsIntegration';
import SettingsNFT from './SettingsNFT';
import SettingsProfiles from './SettingsProfiles';

enum SettingsTab {
  GENERAL = 'general',
  PROFILES = 'profiles',
  NFT = 'nft',
  DATALAYER = 'datalayer',
  INTEGRATION = 'integration',
  ADVANCED = 'advanced',
}

const SettingsTabsPathMapping = {
  [SettingsTab.GENERAL]: '/dashboard/settings/general',
  [SettingsTab.PROFILES]: '/dashboard/settings/profiles',
  [SettingsTab.NFT]: '/dashboard/settings/nft',
  [SettingsTab.DATALAYER]: '/dashboard/settings/datalayer',
  [SettingsTab.INTEGRATION]: '/dashboard/settings/integration',
  [SettingsTab.ADVANCED]: '/dashboard/settings/advanced',
};

export default function Settings() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const mapping = {
    ...SettingsTabsPathMapping,
    [SettingsTab.PROFILES]: '/dashboard/settings/profiles/*',
  };

  const activeTab =
    Object.entries(mapping).find(([, pattern]) => !!matchPath(pattern, pathname))?.[0] ?? SettingsTab.GENERAL;

  function handleChangeTab(newTab: SettingsTab) {
    const path = SettingsTabsPathMapping[newTab] ?? SettingsTabsPathMapping[SettingsTab.GENERAL];
    navigate(path);
  }

  return (
    <LayoutDashboardSub>
      <Flex flexDirection="column" gap={3}>
        <Typography variant="h5">
          <Trans>Settings</Trans>
        </Typography>
        <Flex gap={3} flexDirection="column">
          <Tabs
            value={activeTab}
            onChange={(_event, newValue) => handleChangeTab(newValue)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab value={SettingsTab.GENERAL} label={<Trans>General</Trans>} data-testid="Settings-tab-general" />
            <Tab value={SettingsTab.PROFILES} label={<Trans>Profiles</Trans>} data-testid="Settings-tab-profiles" />

            <Tab value={SettingsTab.NFT} label={<Trans>NFT</Trans>} data-testid="Settings-tab-nft" />

            <Tab value={SettingsTab.DATALAYER} label={<Trans>DataLayer</Trans>} data-testid="Settings-tab-datalayer" />
            <Tab
              value={SettingsTab.INTEGRATION}
              label={<Trans>Integration</Trans>}
              data-testid="Settings-tab-integration"
            />
            <Tab value={SettingsTab.ADVANCED} label={<Trans>Advanced</Trans>} data-testid="Settings-tab-advanced" />
          </Tabs>

          <Routes>
            <Route path="profiles/*" element={<SettingsProfiles />} />
            <Route path="nft" element={<SettingsNFT />} />
            <Route path="datalayer" element={<SettingsDataLayer />} />
            <Route path="general" element={<SettingsGeneral />} />
            <Route path="integration" element={<SettingsIntegration />} />
            <Route path="advanced" element={<SettingsAdvanced />} />
          </Routes>
        </Flex>
      </Flex>
    </LayoutDashboardSub>
  );
}

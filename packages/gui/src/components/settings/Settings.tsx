import { useLocalStorage } from '@chia-network/api-react';
import { Flex, LayoutDashboardSub } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography, Tab, Tabs } from '@mui/material';
import Badge from '@mui/material/Badge';
import React, { useMemo } from 'react';
import { Routes, Route, matchPath, useLocation, useNavigate } from 'react-router-dom';

import SettingsAdvanced from './SettingsAdvanced';
import SettingsCustody from './SettingsCustody';
import SettingsDataLayer from './SettingsDataLayer';
import SettingsGeneral from './SettingsGeneral';
import SettingsIntegration from './SettingsIntegration';
import SettingsNFT from './SettingsNFT';
import SettingsNotifications from './SettingsNotifications';
import SettingsProfiles from './SettingsProfiles';

const pathPrefix = '/dashboard/settings/';

export default function Settings() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [wasSettingsCustodyVisited] = useLocalStorage<boolean>('newFlag--wasSettingsCustodyVisited', false);

  const settingsTabs = useMemo(
    () => [
      { id: 'general', label: 'General', Component: SettingsGeneral, path: 'general' },
      {
        id: 'custody',
        label: 'Custody',
        Component: SettingsCustody,
        path: 'custody',
        badge: wasSettingsCustodyVisited ? undefined : 'NEW',
      },
      { id: 'profiles', label: 'Profiles (DIDs)', Component: SettingsProfiles, path: 'profiles/*' },
      { id: 'nft', label: 'NFT', Component: SettingsNFT, path: 'nft' },
      { id: 'datalayer', label: 'DataLayer', Component: SettingsDataLayer, path: 'datalayer' },
      { id: 'integration', label: 'Integration', Component: SettingsIntegration, path: 'integration' },
      { id: 'notifications', label: 'Notifications', Component: SettingsNotifications, path: 'notifications' },
      { id: 'advanced', label: 'Advanced', Component: SettingsAdvanced, path: 'advanced' },
    ],
    [wasSettingsCustodyVisited]
  );

  const activeTabId = settingsTabs.find((tab) => !!matchPath(pathPrefix + tab.path, pathname))?.id;

  function handleChangeTab(newTabId: string) {
    const newTab = settingsTabs.find((tab) => tab.id === newTabId);
    if (!newTab) {
      return;
    }

    let path = pathPrefix + newTab.path;

    // The path in the settingsTabs is used for matching, so it might contain a wildcard.
    // So we need to remove /* from the path to navigate to the correct path.
    if (path.endsWith('/*')) {
      path = path.slice(0, -2);
    }

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
            value={activeTabId || settingsTabs[0].id}
            onChange={(_event, newValue) => handleChangeTab(newValue)}
            textColor="primary"
            indicatorColor="primary"
            sx={{ '& .MuiTabs-flexContainer': { paddingTop: '10px' } }}
          >
            {settingsTabs.map((tab) => {
              let TabLabel = <Trans>{tab.label}</Trans>;
              if (tab.badge) {
                TabLabel = (
                  <Badge
                    badgeContent={tab.badge}
                    color="primary"
                    sx={{
                      '& .MuiBadge-badge': {
                        top: '-10px',
                      },
                    }}
                  >
                    {TabLabel}
                  </Badge>
                );
              }
              return (
                <Tab
                  value={tab.id}
                  label={TabLabel}
                  data-testid={`Settings-tab-${tab.id}`}
                  key={tab.id}
                  sx={{ overflow: 'visible' }}
                />
              );
            })}
          </Tabs>

          <Routes>
            {settingsTabs.map(({ id, path, Component }) => (
              <Route path={path} element={<Component />} key={id} />
            ))}
          </Routes>
        </Flex>
      </Flex>
    </LayoutDashboardSub>
  );
}

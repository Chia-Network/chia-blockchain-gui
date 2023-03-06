import { WalletType } from '@chia-network/api';
import { useGetWalletsQuery } from '@chia-network/api-react';
import { Flex, LayoutDashboardSub, SettingsHR, SettingsSection, SettingsText } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Grid } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

import IdentitiesPanel from './IdentitiesPanel';
import ProfileAdd from './ProfileAdd';
import ProfileView from './ProfileView';

export default function SettingsProfiles() {
  const navigate = useNavigate();
  const { data: wallets, isLoading } = useGetWalletsQuery();
  const [profileStartDisplay, setProfileStartDisplay] = useState(true);

  const didList = useMemo(() => {
    const dids: number[] = [];
    if (wallets) {
      wallets.forEach((wallet) => {
        if (wallet.type === WalletType.DECENTRALIZED_ID) {
          dids.push(wallet.id);
        }
      });
    }
    setProfileStartDisplay(true);
    return dids;
  }, [wallets]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (profileStartDisplay) {
      if (didList.length) {
        navigate(`/dashboard/settings/profiles/${didList[0]}`);
      } else {
        navigate(`/dashboard/settings/profiles/add`);
      }
      setProfileStartDisplay(false);
    }
  }, [isLoading, profileStartDisplay, didList, navigate]);

  return (
    <Grid container style={{ maxWidth: '624px' }} gap={3}>
      <Grid item>
        <Flex flexDirection="column" gap={1}>
          <SettingsSection>
            <Trans>Profiles (DIDs)</Trans>
          </SettingsSection>
          <SettingsText>
            <Trans>
              A profile is a decentralized identifier (DID) that you can prove control and ownership of without having
              to rely on any centralized authority. You can have as many DIDs as you want that can be used to represent
              different aspects of your identity like establishing provenance of creation or ownership for NFTs.
            </Trans>
          </SettingsText>
        </Flex>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Routes>
          <Route element={<LayoutDashboardSub sidebar={<IdentitiesPanel />} outlet />}>
            <Route path=":walletId" element={<ProfileView />} />
            <Route path="add" element={<ProfileAdd />} />
          </Route>
        </Routes>
      </Grid>
    </Grid>
  );
}

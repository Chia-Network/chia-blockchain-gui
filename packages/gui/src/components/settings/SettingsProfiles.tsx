import { WalletType } from '@chia-network/api';
import { useGetWalletsQuery } from '@chia-network/api-react';
import { Flex, LayoutDashboardSub } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Add } from '@mui/icons-material';
import { IconButton, Typography } from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

import IdentitiesPanel from './IdentitiesPanel';
import ProfileAdd from './ProfileAdd';
import ProfileView from './ProfileView';

export default function SettingsProfiles() {
  const navigate = useNavigate();
  const { data: wallets } = useGetWalletsQuery();

  const didList = useMemo(() => {
    const dids: number[] = [];
    if (wallets) {
      wallets.forEach((wallet) => {
        if (wallet.type === WalletType.DECENTRALIZED_ID) {
          dids.push(wallet.id);
        }
      });
    }
    return dids;
  }, [wallets]);

  useEffect(() => {
    if (didList.length) {
      navigate(`/dashboard/settings/profiles/${didList[0]}`);
    } else {
      navigate(`/dashboard/settings/profiles/add`);
    }
  }, [didList]);

  function navAdd() {
    navigate(`/dashboard/settings/profiles/add`);
  }

  return (
    <div>
      <Flex flexDirection="row" style={{ width: '350px' }}>
        <Flex flexGrow={1}>
          <Typography variant="h4">
            <Trans>Profiles</Trans>
          </Typography>
        </Flex>
        <Flex alignSelf="end">
          <IconButton onClick={navAdd}>
            <Add />
          </IconButton>
        </Flex>
      </Flex>
      <Routes>
        <Route element={<LayoutDashboardSub sidebar={<IdentitiesPanel />} outlet />}>
          <Route path=":walletId" element={<ProfileView />} />
          <Route path="add" element={<ProfileAdd />} />
        </Route>
      </Routes>
    </div>
  );
}

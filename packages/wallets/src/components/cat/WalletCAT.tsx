import { WalletType } from '@chia/api';
import { useSetCATNameMutation, useGetCatListQuery } from '@chia/api-react';
import { Flex, Loading, MenuItem, useOpenDialog } from '@chia/core';
import { Offers as OffersIcon } from '@chia/icons';
import { Trans } from '@lingui/macro';
import { Edit as RenameIcon, Fingerprint as FingerprintIcon } from '@mui/icons-material';
import { Box, ListItemIcon, Alert, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import useWallet from '../../hooks/useWallet';
import WalletCards from '../WalletCards';
import WalletHeader from '../WalletHeader';
import WalletHistory from '../WalletHistory';
import WalletReceiveAddress from '../WalletReceiveAddress';
import WalletRenameDialog from '../WalletRenameDialog';
import WalletCATSend from './WalletCATSend';
import WalletCATTAILDialog from './WalletCATTAILDialog';

type Props = {
  walletId: number;
};

export default function WalletCAT(props: Props) {
  const { walletId } = props;
  const { wallet, loading } = useWallet(walletId);
  const { data: catList = [], isLoading: isCatListLoading } = useGetCatListQuery();
  const navigate = useNavigate();
  const openDialog = useOpenDialog();
  const [setCATName] = useSetCATNameMutation();
  const [selectedTab, setSelectedTab] = useState<'summary' | 'send' | 'receive'>('summary');

  function handleRename() {
    if (!wallet) {
      return;
    }

    const { name } = wallet;

    openDialog(
      <WalletRenameDialog name={name} onSave={(newName) => setCATName({ walletId, name: newName }).unwrap()} />
    );
  }

  function handleShowTAIL() {
    openDialog(<WalletCATTAILDialog walletId={walletId} />);
  }

  function handleCreateOffer() {
    navigate('/dashboard/offers/builder', {
      state: {
        assetId: wallet.meta?.assetId,
        walletType: WalletType.CAT,
        referrerPath: location.hash.split('#').slice(-1)[0],
      },
    });
  }

  if (loading || isCatListLoading) {
    return <Loading center />;
  }

  if (!wallet) {
    return (
      <Alert severity="error">
        <Trans>Wallet does not exists</Trans>
      </Alert>
    );
  }

  const token = catList.find((item) => item.assetId === wallet.meta?.assetId);
  const canRename = !token;

  return (
    <Flex flexDirection="column" gap={2.5}>
      <WalletHeader
        walletId={walletId}
        tab={selectedTab}
        onTabChange={setSelectedTab}
        actions={[
          canRename && (
            <MenuItem onClick={handleRename} key="rename-wallet" close>
              <ListItemIcon>
                <RenameIcon />
              </ListItemIcon>
              <Typography variant="inherit" noWrap>
                <Trans>Rename Wallet</Trans>
              </Typography>
            </MenuItem>
          ),
          <MenuItem onClick={handleShowTAIL} key="show-asset-id" close>
            <ListItemIcon>
              <FingerprintIcon />
            </ListItemIcon>
            <Typography variant="inherit" noWrap>
              <Trans>Show Asset Id</Trans>
            </Typography>
          </MenuItem>,
          <MenuItem onClick={handleCreateOffer} key="create-offer" close>
            <ListItemIcon>
              <OffersIcon />
            </ListItemIcon>
            <Typography variant="inherit" noWrap>
              <Trans>Create Offer</Trans>
            </Typography>
          </MenuItem>,
        ]}
      />

      <Box display={selectedTab === 'summary' ? 'block' : 'none'}>
        <Flex flexDirection="column" gap={4}>
          <WalletCards walletId={walletId} />
          <WalletHistory walletId={walletId} />
        </Flex>
      </Box>
      <Box display={selectedTab === 'send' ? 'block' : 'none'}>
        <WalletCATSend walletId={walletId} />
      </Box>
      <Box display={selectedTab === 'receive' ? 'block' : 'none'}>
        <WalletReceiveAddress walletId={walletId} />
      </Box>
    </Flex>
  );
}

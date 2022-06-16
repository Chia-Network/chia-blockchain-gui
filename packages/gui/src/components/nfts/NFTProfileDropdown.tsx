import React, { useMemo, useState } from 'react';
import { Trans } from '@lingui/macro';
import type { Wallet } from '@chia/api';
import { DropdownActions, usePersistState } from '@chia/core';
import {
  AutoAwesome as AutoAwesomeIcon,
  PermIdentity as PermIdentityIcon,
} from '@mui/icons-material';
import { ListItemIcon, MenuItem } from '@mui/material';
import {
  useGetDIDsQuery,
  useGetNFTWallets,
  useGetNFTWalletsWithDIDsQuery,
} from '@chia/api-react';
import { NFTsSmall as NFTsSmallIcon } from '@chia/icons';
import { orderBy } from 'lodash';

type Profile = Wallet & {
  nftWalletId: number;
};

function useProfiles() {
  // const { data: wallets, isLoading, error } = useGetWalletsQuery();
  const { data: dids, isLoading, error } = useGetDIDsQuery();
  const { data: nftWallets, isLoading: loadingNFTWallets } =
    useGetNFTWalletsWithDIDsQuery();

  const profiles: Profile[] = useMemo(() => {
    if (!dids || !nftWallets) {
      return [];
    }
    const profiles = nftWallets.map((nftWallet: Wallet) => {
      return {
        ...dids.find(
          (didWallet: Wallet) => didWallet.id === nftWallet.didWalletId,
        ),
        nftWalletId: nftWallet.walletId,
      };
    });

    return orderBy(profiles, ['name'], ['asc']);
  }, [dids, nftWallets]);

  return {
    isLoading: isLoading || loadingNFTWallets,
    data: profiles,
    error,
  };
}

export type NFTGallerySidebarProps = {
  walletId?: number;
  onChange: (walletId?: number) => void;
};

export default function NFTProfileDropdown(props: NFTGallerySidebarProps) {
  const { onChange, walletId } = props;
  const { isLoading: isLoadingProfiles, data: profiles } = useProfiles();
  const { wallets: nftWallets, isLoading: isLoadingNFTWallets } =
    useGetNFTWallets();

  console.log('profiles:');
  console.log(profiles);

  const inbox: Wallet | undefined = useMemo(() => {
    if (isLoadingProfiles || isLoadingNFTWallets) {
      return undefined;
    }

    const nftWalletIds = nftWallets.map((nftWallet) => nftWallet.id);
    console.log('nftWalletIds');
    console.log(nftWalletIds);
    const profileWalletIds = new Set(
      profiles.map((profile) => profile.nftWalletId),
    );
    console.log('profileWalletIds');
    console.log(profileWalletIds);
    const inboxWalletId = nftWalletIds.find(
      (nftWalletId) => !profileWalletIds.has(nftWalletId),
    );
    return nftWallets.find((wallet) => wallet.id === inboxWalletId);
  }, [profiles, nftWallets, isLoadingProfiles, isLoadingNFTWallets]);

  const label = useMemo(() => {
    if (isLoadingProfiles || isLoadingNFTWallets) {
      return 'Loading...';
    }

    if (inbox && inbox.id === walletId) {
      return <Trans>NFT Inbox</Trans>;
    }

    const profile = profiles?.find(
      (item: Profile) => item.nftWalletId === walletId,
    );

    return profile?.name || <Trans>All Profiles</Trans>;
  }, [profiles, isLoadingProfiles, isLoadingNFTWallets, walletId, inbox]);

  console.log('inbox');
  console.log(inbox);

  console.log('selected walletId');
  console.log(walletId);

  function handleWalletChange(newWalletId?: number) {
    console.log('handleWalletChange:');
    console.log(newWalletId);
    onChange?.(newWalletId);
  }

  return (
    <DropdownActions
      onSelect={handleWalletChange}
      label={label}
      variant="text"
      color="secondary"
      size="large"
    >
      {({ onClose }) => (
        <>
          <MenuItem
            key="all"
            onClick={() => {
              onClose();
              handleWalletChange();
            }}
            selected={walletId === undefined}
          >
            <ListItemIcon>
              <AutoAwesomeIcon />
            </ListItemIcon>
            <Trans>All</Trans>
          </MenuItem>
          {inbox && (
            <MenuItem
              key="inbox"
              onClick={() => {
                onClose();
                handleWalletChange(inbox.id);
              }}
              selected={walletId === inbox.id}
            >
              <ListItemIcon>
                <NFTsSmallIcon />
              </ListItemIcon>
              <Trans>NFTs</Trans>
            </MenuItem>
          )}
          {(profiles ?? []).map((profile: Profile) => (
            <MenuItem
              key={profile.nftWalletId}
              onClick={() => {
                onClose();
                handleWalletChange(profile.nftWalletId);
              }}
              selected={profile.nftWalletId === walletId}
            >
              <ListItemIcon>
                <PermIdentityIcon />
              </ListItemIcon>
              {profile.name}
            </MenuItem>
          ))}
        </>
      )}
    </DropdownActions>
  );
}

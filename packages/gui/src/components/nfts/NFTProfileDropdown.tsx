import type { Wallet } from '@chia-network/api';
import {
  useGetLoggedInFingerprintQuery,
  useGetDIDsQuery,
  useGetNFTWallets,
  useGetNFTWalletsWithDIDsQuery,
  useLocalStorage,
} from '@chia-network/api-react';
import { useOpenDialog, AddUserFolderDialog, Flex, ConfirmDialog } from '@chia-network/core';
import {
  Profile as ProfileIcon,
  Folder as FolderIcon,
  Plus as PlusIcon,
  ShowHide as ShowHideIcon,
  Inbox as InboxIcon,
  Unassigned as UnassignedIcon,
  Trash as TrashIcon,
} from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { Divider, MenuItem, Collapse } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { orderBy } from 'lodash';
import React, { useMemo } from 'react';

import useNFTFilter from '../../hooks/useNFTFilter';
import useNFTProvider from '../../hooks/useNFTProvider';
import useNachoNFTs from '../../hooks/useNachoNFTs';
import { getNFTInbox } from './utils';

type Profile = Wallet & {
  nftWalletId: number;
};
function useProfiles() {
  // const { data: wallets, isLoading, error } = useGetWalletsQuery();
  const { data: dids, isLoading, error } = useGetDIDsQuery();
  const { data: nftWallets, isLoading: loadingNFTWallets } = useGetNFTWalletsWithDIDsQuery();

  const profiles: Profile[] = useMemo(() => {
    if (!dids || !nftWallets) {
      return [];
    }
    const profilesLocal = nftWallets.map((nftWallet: Wallet) => ({
      ...dids.find((didWallet: Wallet) => didWallet.id === nftWallet.didWalletId),
      nftWalletId: nftWallet.walletId,
    }));

    return orderBy(profilesLocal, ['name'], ['asc']);
  }, [dids, nftWallets]);

  return {
    isLoading: isLoading || loadingNFTWallets,
    data: profiles,
    error,
  };
}

export type NFTGallerySidebarProps = {
  walletId?: number;
  onChange: (walletId: number | undefined) => void;
  onSelectUserFolder: (folderName: string) => void;
  setUserFolder: (folderName: string) => void;
};

export default function NFTProfileDropdown(props: NFTGallerySidebarProps) {
  const { onChange, walletId, onSelectUserFolder, setUserFolder } = props;
  const { isLoading: isLoadingProfiles, data: profiles } = useProfiles();
  const { wallets: nftWallets, isLoading: isLoadingNFTWallets } = useGetNFTWallets();
  const { data: nachoNFTs, isLoading: isLoadingNachoNFTs } = useNachoNFTs();
  const haveNachoNFTs = !isLoadingNachoNFTs && nachoNFTs?.length > 0;
  const openDialog = useOpenDialog();
  const [userFolders, setUserFolders] = useLocalStorage('user-folders', {});
  const [userFoldersNFTs, setUserFoldersNFTs] = useLocalStorage('user-folders-nfts', {});
  const { data: fingerprint } = useGetLoggedInFingerprintQuery();
  const theme: any = useTheme();
  const { nftsCounts } = useNFTProvider();
  const [showMenuItems, toggleShowMenuItems] = React.useState<boolean>(true);
  const [draggedNFT, setDraggedNFT] = useLocalStorage<any>('dragged-nft', null);
  const filter = useNFTFilter();
  const [editFolderName, setEditFolderName] = React.useState<string | null>(null);
  const [editingFolder, setEditingFolder] = React.useState<string | null>(null);

  const inbox: Wallet | undefined = useMemo(() => {
    if (isLoadingNFTWallets) {
      return undefined;
    }

    return getNFTInbox(nftWallets);
  }, [nftWallets, isLoadingNFTWallets]);

  const remainingNFTWallets = useMemo(() => {
    if (isLoadingProfiles || isLoadingNFTWallets || !inbox) {
      return undefined;
    }

    const nftWalletsWithoutDIDs = nftWallets.filter(
      (nftWallet: Wallet) =>
        nftWallet.id !== inbox.id &&
        profiles.find((profile: Profile) => profile.nftWalletId === nftWallet.id) === undefined
    );

    return nftWalletsWithoutDIDs;
  }, [profiles, nftWallets, inbox, isLoadingProfiles, isLoadingNFTWallets]);

  function handleWalletChange(newWalletId?: number) {
    setUserFolder(null);
    onChange?.(newWalletId);
  }

  async function addUserFolder() {
    await openDialog(
      <AddUserFolderDialog
        onAdd={(newFolderName: string) => {
          if (!userFolders[fingerprint] || userFolders[fingerprint].indexOf(newFolderName) === -1) {
            setUserFolders({
              [fingerprint]: [...(userFolders[fingerprint] || []), newFolderName],
            });
          }
        }}
        title={<Trans>Add New Folder</Trans>}
      />
    );
  }

  const MenuItemChildren = React.useCallback(
    (props2: any) => (
      <Flex
        justifyContent="space-between"
        gap={3}
        sx={{
          fontSize: '14px',
          width: '100%',
          svg: {
            marginRight: '10px',
          },
        }}
        onMouseUp={() => {
          if (draggedNFT && props2.folderName) {
            const copyUserFoldersNFTs = { ...userFoldersNFTs };
            if (!copyUserFoldersNFTs[fingerprint]) {
              copyUserFoldersNFTs[fingerprint] = { [props2.folderName]: [] };
            }
            if (!copyUserFoldersNFTs[fingerprint][props2.folderName]) {
              copyUserFoldersNFTs[fingerprint][props2.folderName] = [];
            }
            if (copyUserFoldersNFTs[fingerprint][props2.folderName].indexOf(draggedNFT) === -1) {
              copyUserFoldersNFTs[fingerprint] = {
                ...copyUserFoldersNFTs[fingerprint],
                [props2.folderName]: copyUserFoldersNFTs[fingerprint][props2.folderName].concat(draggedNFT),
              };
            }
            setUserFoldersNFTs(copyUserFoldersNFTs);
            setDraggedNFT(null);
          }
        }}
      >
        {props2.children}
      </Flex>
    ),
    [userFoldersNFTs, setUserFoldersNFTs, fingerprint, draggedNFT, setDraggedNFT]
  );

  async function deleteUserFolder(folder) {
    await openDialog(
      <ConfirmDialog
        title={<Trans>Delete Folder Confirmation</Trans>}
        confirmTitle={<Trans>Delete</Trans>}
        confirmColor="danger"
        onConfirm={() => {
          const userFoldersCopy = { ...userFolders };
          userFoldersCopy[fingerprint] = (userFolders[fingerprint] || []).filter((f: string) => f !== folder);
          setUserFolders(userFoldersCopy);
          // setSelectedUserFolder(undefined);
          // setWalletId(undefined);
        }}
      >
        <Trans>Are you sure you want to remove this gallery? This action cannot be undone.</Trans>
      </ConfirmDialog>
    );
  }

  function saveRenamedUserFolder(folderName: string) {
    setEditFolderName(null);
    if (editFolderName === '') return;
    setUserFolders({
      ...userFolders,
      [fingerprint]: (userFolders[fingerprint] || []).map((f: string) => (f === folderName ? editFolderName : f)),
    });
    const fingerprintFolder = userFoldersNFTs[fingerprint];
    const nftIdsArray = fingerprintFolder[folderName] ? [...fingerprintFolder[folderName]] : [];
    delete fingerprintFolder[folderName];
    setUserFoldersNFTs({
      ...userFoldersNFTs,
      [fingerprint]: {
        ...fingerprintFolder,
        [editFolderName as any]: nftIdsArray,
      },
    });
    setUserFolder(editFolderName as string);
  }

  function renderFolderName(folderName: string) {
    if (editingFolder === folderName) {
      return (
        <input
          type="text"
          style={{
            fontFamily: 'Roboto',
            fontSize: '14px',
            border: 0,
            outline: 'none',
            background: 'rgba(255, 255, 255, 0.5)',
            padding: '0px 5px',
            position: 'relative',
            left: '-5px',
            letterSpacing: '0.15px',
            top: '-0.5px',
          }}
          value={editFolderName}
          onInput={(e: any) => setEditFolderName(e.target.value)}
          onBlur={() => {
            setEditFolderName(null);
            setEditingFolder(null);
          }}
          onKeyDown={(e: any) => {
            if (e.key === 'Enter') {
              saveRenamedUserFolder(folderName);
              setEditingFolder(null);
            }
            if (e.key === 'Escape') {
              setEditFolderName(null);
              setEditingFolder(null);
            }
          }}
          autoFocus
        />
      );
    }
    return (
      <div
        style={{
          maxWidth: '250px',
          overflowX: 'hidden',
          textOverflow: 'ellipsis',
          marginRight: '10px',
          cursor: filter.userFolder && filter.userFolder === folderName ? 'text' : 'pointer',
        }}
        onClick={() => {
          if (filter.userFolder === folderName) {
            setEditFolderName(folderName);
            setEditingFolder(folderName);
          }
        }}
      >
        {folderName}
      </div>
    );
  }

  function renderMenuItems() {
    return (
      <Collapse orientation="horizontal" in={showMenuItems} timeout={200}>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '60px' }}>
          <MenuItem
            key="all"
            onClick={() => handleWalletChange()}
            selected={walletId === undefined && !filter.userFolder}
          >
            <MenuItemChildren>
              <Flex>
                <InboxIcon />
                <Trans>All NFTs</Trans>
              </Flex>
              <Flex>{nftsCounts[0]}</Flex>
            </MenuItemChildren>
          </MenuItem>
          {inbox && (
            <MenuItem
              key="inbox"
              onClick={() => handleWalletChange(inbox.id)}
              selected={walletId === inbox.id && !filter.userFolder}
            >
              <MenuItemChildren>
                <Flex>
                  <UnassignedIcon />
                  <Trans>Unassigned NFTs</Trans>
                </Flex>
                <Flex>{nftsCounts[inbox.id]}</Flex>
              </MenuItemChildren>
            </MenuItem>
          )}
          {(remainingNFTWallets ?? []).map((wallet: Wallet) => (
            <MenuItem
              key={wallet.id}
              onClick={() => handleWalletChange(wallet.id)}
              selected={walletId === wallet.id && !filter.userFolder}
            >
              <MenuItemChildren>
                <ProfileIcon /> {wallet.name} {wallet.id}
              </MenuItemChildren>
            </MenuItem>
          ))}
          {(profiles ?? []).map((profile: Profile) => (
            <MenuItem
              key={profile.nftWalletId}
              onClick={() => handleWalletChange(profile.nftWalletId)}
              selected={profile.nftWalletId === walletId && !filter.userFolder}
            >
              <MenuItemChildren>
                <Flex>
                  <ProfileIcon />
                  <div style={{ maxWidth: '250px', overflowX: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</div>
                </Flex>
                <Flex>{nftsCounts[profile.nftWalletId] >= 0 ? nftsCounts[profile.nftWalletId] : ''}</Flex>
              </MenuItemChildren>
            </MenuItem>
          ))}
          {haveNachoNFTs && (
            <MenuItem key="nacho" onClick={() => handleWalletChange(-1)} selected={walletId === -1}>
              <MenuItemChildren>
                <Flex>
                  <ProfileIcon />
                  <Trans>Nacho NFTs</Trans>
                </Flex>
                <Flex>{nachoNFTs?.length} </Flex>
              </MenuItemChildren>
            </MenuItem>
          )}
          <Divider />
          <Flex sx={{ fontSize: '13px', padding: '5px 10px 5px' }} justifyContent="space-between">
            <Trans>Folders</Trans> {userFolders[fingerprint] ? `(${userFolders[fingerprint].length})` : '(0)'}
            <div
              style={{
                background: theme.palette.colors.default.main,
                width: '19px',
                height: '19px',
                borderRadius: '50%',
                padding: '3px 0 0 3px',
                cursor: 'pointer',
              }}
            >
              <PlusIcon onClick={() => addUserFolder()} />
            </div>
          </Flex>
          {Array.isArray(userFolders[fingerprint]) && userFolders[fingerprint].length > 0
            ? userFolders[fingerprint].map((folderName: string) => (
                <MenuItem
                  key={folderName}
                  onClick={() => {
                    onSelectUserFolder(folderName);
                    setUserFolder(folderName);
                  }}
                  selected={folderName === filter.userFolder}
                  sx={{
                    '.folder-trash': {
                      display: 'none',
                      height: '20px',
                      width: '18px',
                      paddingTop: '1px',
                      marginRight: '10px',
                      position: 'absolute',
                      right: '25px',
                    },
                    ':hover': {
                      '.folder-trash': {
                        display: editingFolder ? 'none' : 'block',
                      },
                    },
                  }}
                >
                  <MenuItemChildren folderName={folderName}>
                    <Flex>
                      <FolderIcon />
                      {renderFolderName(folderName)}
                    </Flex>
                    <Flex>
                      <div
                        className="folder-trash"
                        onClick={(e) => {
                          deleteUserFolder(folderName);
                          e.stopPropagation();
                        }}
                      >
                        <TrashIcon />
                      </div>
                      {userFoldersNFTs[fingerprint] && userFoldersNFTs[fingerprint][folderName]
                        ? userFoldersNFTs[fingerprint][folderName].length
                        : 0}
                    </Flex>
                  </MenuItemChildren>
                </MenuItem>
              ))
            : null}
          {userFolders[fingerprint] && userFolders[fingerprint].length > 0 ? <Divider /> : null}
        </div>
      </Collapse>
    );
  }

  function renderShowHide() {
    return (
      <Flex
        sx={{
          padding: '10px 0 25px 17px',
          svg: {
            marginRight: '11px',
          },
          cursor: 'pointer',
          position: 'absolute',
        }}
        onClick={() => {
          toggleShowMenuItems(!showMenuItems);
        }}
      >
        <ShowHideIcon />
        {showMenuItems ? <Trans>Hide</Trans> : <Trans>Show</Trans>}
      </Flex>
    );
  }

  return (
    <Flex
      flexDirection="column"
      sx={{
        padding: '15px',
        fontSize: '14px',
        div: {
          whiteSpace: 'nowrap',
        },
      }}
    >
      {renderShowHide()}
      {renderMenuItems()}
    </Flex>
  );
}

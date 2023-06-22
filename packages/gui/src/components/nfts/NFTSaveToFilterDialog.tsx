import { useGetLoggedInFingerprintQuery, usePrefs } from '@chia-network/api-react';
import { DropdownActions, MenuItem } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { FolderOpen as FolderIcon } from '@mui/icons-material';
import { Dialog, DialogTitle, DialogContent, DialogActions, ListItemIcon, Button } from '@mui/material';
import React from 'react';

import useNFTFilter from '../../hooks/useNFTFilter';

interface NFTSaveToFilterDialogProps {
  nftIds: string[];
}

export default function AppVersionWarning(props: NFTSaveToFilterDialogProps) {
  const [open, setOpen] = React.useState<boolean>(true);
  const { nftIds } = props;
  const [userFolders] = usePrefs('user-folders', {});
  const [userFoldersNFTs, setUserFoldersNFTs] = usePrefs('user-folders-nfts', {});
  const { data: fingerprint } = useGetLoggedInFingerprintQuery();
  const filter = useNFTFilter();

  function addSelectedNFTsToGallery(folderName: string) {
    const fingerprintNFTs = { ...userFoldersNFTs[fingerprint] };
    const tempNFTs: string[] = userFoldersNFTs[fingerprint][folderName]
      ? [...userFoldersNFTs[fingerprint][folderName]]
      : [];
    nftIds.forEach((nftId: string) => {
      if (tempNFTs.indexOf(nftId) === -1) {
        tempNFTs.push(nftId);
      }
    });
    fingerprintNFTs[folderName] = tempNFTs;
    setUserFoldersNFTs({
      [fingerprint]: fingerprintNFTs,
    });
    filter.setSelectedNFTIds([]);
    setOpen(false);
  }

  return (
    <Dialog open={open} aria-labelledby="alert-dialog-title" fullWidth>
      <DialogTitle id="alert-dialog-title">
        <Trans>Save NFTs to filter</Trans>
      </DialogTitle>
      <DialogContent>
        <DropdownActions variant="contained" label={<Trans>Choose filter</Trans>}>
          {Array.isArray(userFolders[fingerprint]) &&
            userFolders[fingerprint].map((folderName: string) => (
              <MenuItem key={folderName} onClick={() => addSelectedNFTsToGallery(folderName)}>
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                {folderName}
              </MenuItem>
            ))}
        </DropdownActions>
      </DialogContent>
      <DialogActions>
        <div style={{ padding: '0 10px 10px 0' }}>
          <Button
            onClick={() => {
              setOpen(false);
            }}
            color="primary"
            variant="outlined"
          >
            <Trans>Cancel</Trans>
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
}

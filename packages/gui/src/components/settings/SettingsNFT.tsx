import { usePrefs } from '@chia-network/api-react';
import { Flex, SettingsHR, SettingsLabel, SettingsSection, SettingsText, SettingsTitle, AlertDialog, useOpenDialog, FormatBytes, ConfirmDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Grid, Box, Button, Switch, FormGroup, FormControlLabel, Typography } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import useHideObjectionableContent from '../../hooks/useHideObjectionableContent';
import useNFTImageFittingMode from '../../hooks/useNFTImageFittingMode';
import LimitCacheSize from './LimitCacheSize';

export default function SettingsGeneral() {
  const [hideObjectionableContent, setHideObjectionableContent] = useHideObjectionableContent();

  function handleChangeHideObjectionableContent(event: React.ChangeEvent<HTMLInputElement>) {
    setHideObjectionableContent(event.target.checked);
  }

  const [nftImageFittingMode, setNFTImageFittingMode] = useNFTImageFittingMode();
  const [cacheFolder, setCacheFolder] = usePrefs('cacheFolder', '');
  const [defaultCacheFolder, setDefaultCacheFolder] = React.useState('');
  const [cacheSize, setCacheSize] = React.useState(0);
  const openDialog = useOpenDialog();
  const { ipcRenderer } = window as any;

  function handleScalePreviewImages(event: React.ChangeEvent<HTMLInputElement>) {
    setNFTImageFittingMode(event.target.checked ? 'contain' : 'cover');
  }

  React.useEffect(() => {
    ipcRenderer.invoke('getDefaultCacheFolder').then((folder: string) => {
      setDefaultCacheFolder(folder);
    });
    ipcRenderer.invoke('getCacheSize').then((cacheSizeLocal: number) => {
      setCacheSize(cacheSizeLocal);
    });
  }, [ipcRenderer]);

  async function forceUpdateCacheSize() {
    setCacheSize(await ipcRenderer.invoke('getCacheSize'));
  }

  async function clearNFTCache() {
    openDialog(
      <ConfirmDialog
        title={<Trans>Clear NFT cache</Trans>}
        confirmTitle={<Trans>Yes, delete</Trans>}
        confirmColor="danger"
        onConfirm={() => {
          ipcRenderer.invoke('clearNFTCache').then(() => {
            setCacheSize(0);
            Object.keys(localStorage).forEach((key) => {
              if (key.indexOf('content-cache-') > -1) localStorage.removeItem(key);
              if (key.indexOf('thumb-cache-') > -1) localStorage.removeItem(key);
              if (key.indexOf('metadata-cache-') > -1) localStorage.removeItem(key);
              if (key.indexOf('force-reload-') > -1) localStorage.removeItem(key);
            });
          });
        }}
      >
        <Trans>Are you sure you want to delete the NFT cache?</Trans>
      </ConfirmDialog>
    );
  }

  const CacheTable = styled.div`
    display: table;
    margin-top: 15px;
    font-size: 15px;
    max-width: 10px;
    > div {
      display: table-row;
      > div {
        display: table-cell;
        padding: 10px 20px 10px 0;
        white-space: nowrap;
      }
      > div:nth-child(2) {
        font-weight: bold;
        min-width: 250px;
      }
    }
  `;

  /*
  const horRule = () => (
    <hr
      style={{
        color: E0E0E0,
        height: 1,
      }}
    />
  )
  */

  function renderCacheFolder() {
    if (cacheFolder) {
      return cacheFolder;
    }
    return defaultCacheFolder;
  }

  function renderCacheSize() {
    return <FormatBytes value={cacheSize} precision={3} />;
  }

  async function chooseAnotherFolder() {
    const newFolder = await ipcRenderer.invoke('selectCacheFolder');

    if (!newFolder.canceled) {
      const folderFileCount = await ipcRenderer.invoke('isNewFolderEmtpy', newFolder.filePaths[0]);

      if (folderFileCount > 0) {
        openDialog(
          <AlertDialog title={<Trans>Error</Trans>}>
            <Trans>Please select an empty folder</Trans>
          </AlertDialog>
        );
      } else {
        ipcRenderer.invoke('changeCacheFolderFromTo', [cacheFolder, newFolder.filePaths[0]]);
        setCacheFolder(newFolder.filePaths[0]);
      }
    }
  }

  // <Grid item xs={12} sm={6} lg={6}>

  return (
    <Grid container style={{ maxWidth: '624px' }} gap={2}>
      <Grid item style={{ maxWidth: '400px' }}>
        <Flex flexDirection="column" gap={1}>
          <SettingsSection>
            <Trans>NFT Content</Trans>
          </SettingsSection>
          <SettingsText>
            <Trans>Choose what you want to see and how you want to view it.</Trans>
          </SettingsText>
        </Flex>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid container>
        <Grid item style={{width: "400px"}}>
          <SettingsTitle>
            <Trans>Hide objectionable content</Trans>
          </SettingsTitle>
        </Grid>
        <Grid item container xs justifyContent="flex-end" marginTop="-6px">
          <FormControlLabel
            control={<Switch checked={hideObjectionableContent} onChange={handleChangeHideObjectionableContent} />}
          />
        </Grid>
        <Grid item style={{width: "400px"}}>
          <SettingsText>
            <Trans>NFTs that have been categorized by the creator as objectionable content will be hidden by default.</Trans>
          </SettingsText>
        </Grid>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid container>
        <Grid item style={{width: "400px"}}>
          <SettingsTitle>
            <Trans>Fit images to cards</Trans>
          </SettingsTitle>
        </Grid>
        <Grid item container xs justifyContent="flex-end" marginTop="-6px">
          <FormControlLabel
              control={<Switch checked={nftImageFittingMode === 'contain'} onChange={handleScalePreviewImages} />}
          />
        </Grid>
        <Grid item style={{width: "400px"}}>
          <SettingsText>
            <Trans>Images will be scaled to fill the NFT card and ignore their original proportions.</Trans>
          </SettingsText>
        </Grid>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid item style={{ maxWidth: '400px' }}>
        <Flex flexDirection="column" gap={1}>
          <SettingsSection>
            <Trans>Cache</Trans>
          </SettingsSection>
          <SettingsText>
            <Trans>Manage how and where files are stored on this computer.</Trans>
          </SettingsText>
        </Flex>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid container>
        <Grid item style={{width: "400px"}}>
          <SettingsTitle>
            <Trans>Occupied space</Trans>
          </SettingsTitle>
        </Grid>
        <Grid item container xs justifyContent="flex-end">
          <Button onClick={clearNFTCache} color="primary" variant="outlined" size="small">
            <Trans>Clear NFT cache</Trans>
          </Button>
        </Grid>
        <Grid item style={{width: "400px"}}>
          <Typography variant="body2" fontWeight="500" component="div">
            {renderCacheSize()}
          </Typography>
        </Grid>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid container>
        <Grid item style={{width: "400px"}}>
          <SettingsTitle>
            <Trans>Local folder</Trans>
          </SettingsTitle>
        </Grid>
        <Grid item container xs justifyContent="flex-end">
          <Button onClick={chooseAnotherFolder} color="primary" variant="outlined" size="small">
            <Trans>Change</Trans>
          </Button>
        </Grid>
        <Grid item style={{width: "400px"}}>
          <Typography variant="body2" fontWeight="500" component="div">
            {renderCacheFolder()}
          </Typography>
        </Grid>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid container>
        <Grid item style={{width: "400px"}}>
          <SettingsTitle>
            <Trans>Limit cache size</Trans>
          </SettingsTitle>
        </Grid>
        <Grid item container xs justifyContent="flex-end">
          <LimitCacheSize forceUpdateCacheSize={forceUpdateCacheSize} />
        </Grid>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

    </Grid>
  );
}

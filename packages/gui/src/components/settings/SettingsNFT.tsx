import { usePrefs } from '@chia/api-react';
import { Flex, SettingsLabel, AlertDialog, useOpenDialog, FormatBytes } from '@chia/core';
import { Trans } from '@lingui/macro';
import { Grid, Box, Button, Switch, FormGroup, FormControlLabel } from '@mui/material';
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
    ipcRenderer.invoke('getCacheSize').then((cacheSize: number) => {
      setCacheSize(cacheSize);
    });
  }, []);

  async function forceUpdateCacheSize() {
    setCacheSize(await ipcRenderer.invoke('getCacheSize'));
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

  return (
    <Grid container>
      <Grid item xs={12} sm={6} lg={3}>
        <Flex flexDirection="column" gap={1}>
          {/* <SettingsLabel>
            <b>
              <Trans>Gallery Management</Trans>
            </b>
          </SettingsLabel> */}

          <FormGroup>
            <FormControlLabel
              control={<Switch checked={hideObjectionableContent} onChange={handleChangeHideObjectionableContent} />}
              label={<Trans>Hide objectionable content</Trans>}
            />

            <FormControlLabel
              control={<Switch checked={nftImageFittingMode === 'contain'} onChange={handleScalePreviewImages} />}
              label={<Trans>Scale NFT images to fit</Trans>}
            />
            <Box sx={{ m: 2 }} />

            <SettingsLabel>
              <b>
                <Trans>Cache</Trans>
              </b>
            </SettingsLabel>

            <CacheTable>
              <div>
                <div>
                  <Trans>Occupied space</Trans>
                </div>
                <div>{renderCacheSize()}</div>
                <div>&nbsp;</div>
              </div>
              <div>
                <div>
                  <Trans>Local folder</Trans>
                </div>
                <div>{renderCacheFolder()}</div>
                <div>
                  <Button onClick={chooseAnotherFolder} color="primary" variant="outlined" size="small">
                    <Trans>Change</Trans>
                  </Button>
                </div>
              </div>
              <div>
                <div>
                  <Trans>Limit cache size</Trans>
                </div>
                <div>
                  <LimitCacheSize forceUpdateCacheSize={forceUpdateCacheSize} />
                </div>
                <div />
              </div>
            </CacheTable>
          </FormGroup>
        </Flex>
      </Grid>
    </Grid>
  );
}

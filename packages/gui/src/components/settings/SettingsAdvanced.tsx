import { Button, Flex, SettingsHR, SettingsSection, SettingsTitle, SettingsText } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Grid } from '@mui/material';
import React from 'react';

import ResyncPrompt from './ResyncPrompt';

export default function SettingsAdvanced() {
  const [resyncWalletOpen, setResyncWalletOpen] = React.useState(false);

  async function resyncWalletSucceeded() {
    closeResyncWallet();
    window.ipcRenderer.invoke('quitGUI');
  }

  function closeResyncWallet() {
    setResyncWalletOpen(false);
  }
  
  return (
    <Grid container style={{ maxWidth: '624px' }} gap={2}>
      <Grid item style={{ maxWidth: '400px' }}>
        <Flex flexDirection="column" gap={1}>
          <SettingsSection>
            <Trans>Advanced</Trans>
          </SettingsSection>
          <SettingsText>
            <Trans>Features for advanced users.</Trans>
          </SettingsText>
        </Flex>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid container>
        <Grid item style={{width: "400px"}}>
          <SettingsTitle>
            <Trans>Resync Wallet</Trans>
          </SettingsTitle>
        </Grid>
        <Grid item container xs justifyContent="flex-end" marginTop="-6px">
          <Button onClick={() => setResyncWalletOpen(true)} variant="outlined" data-testid="SettingsPanel-resync-wallet-db">
            <Trans>Resync</Trans>
          </Button>
          {resyncWalletOpen && <ResyncPrompt onSuccess={resyncWalletSucceeded} onCancel={closeResyncWallet} />}
        </Grid>
        <Grid item container style={{width: "400px"}} gap={2}>
          <SettingsText>
            <Trans>Resyncing forces reloading data from the blockchain about your transactions without losing other locally stored information like open, accepted, or cancelled offer files. Resyncing will require you to restart the app.</Trans>
          </SettingsText>
        </Grid>
      </Grid>
  
      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>
    </Grid>
  );
}
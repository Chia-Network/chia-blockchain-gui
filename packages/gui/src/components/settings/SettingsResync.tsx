// import { useRelaunchGuiQuery } from '@chia-network/api-react';
import { Button, Flex, SettingsLabel, useOpenDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React from 'react';

import ResyncPrompt from './ResyncPrompt';

export default function SettingsResync() {
  const openDialog = useOpenDialog();
  const [resyncOpen, setResyncOpen] = React.useState(false);

  async function tryResync() {
    window.ipcRenderer.invoke('relaunchGUI');
    closeResync();
  }

  function closeResync() {
    setResyncOpen(false);
  }

  return (
    <Flex flexDirection="column" gap={1}>
      <SettingsLabel>
        <Trans>Resync Wallet DB</Trans>
      </SettingsLabel>
      <Button onClick={() => setResyncOpen(true)} variant="outlined" data-testid="SettingsPanel-resync-wallet-db">
          <Trans>Resync</Trans>
      </Button>
      {resyncOpen && <ResyncPrompt onSuccess={tryResync} onCancel={closeResync} />}
      <Typography variant="body2" color="textSecondary">
          <Trans>Resync description info goes here</Trans>
      </Typography>
    </Flex>
  );
}

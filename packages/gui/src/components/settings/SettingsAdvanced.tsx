import {
  Button,
  Flex,
  SettingsHR,
  SettingsSection,
  SettingsTitle,
  SettingsText,
  useOpenDialog,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { RateReview as SignIcon, Verified as VerifyIcon } from '@mui/icons-material';
import { Grid } from '@mui/material';
import React from 'react';

import SignVerifyDialog, { SignVerifyDialogMode } from '../signVerify/SignVerifyDialog';
import ResyncPrompt from './ResyncPrompt';

export default function SettingsAdvanced() {
  const openDialog = useOpenDialog();
  const [resyncWalletOpen, setResyncWalletOpen] = React.useState(false);

  async function resyncWalletSucceeded() {
    closeResyncWallet();
    window.ipcRenderer.invoke('quitGUI');
  }

  function closeResyncWallet() {
    setResyncWalletOpen(false);
  }

  function handleCreateSignature() {
    openDialog(<SignVerifyDialog mode={SignVerifyDialogMode.Sign} />);
  }

  function handleVerifySignature() {
    openDialog(<SignVerifyDialog mode={SignVerifyDialogMode.Verify} />);
  }

  return (
    <Grid container style={{ maxWidth: '624px' }} gap={3}>
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

      <Grid container gap={2}>
        <Grid item style={{ width: '624px' }}>
          <Flex flexDirection="row" alignItems="center" justifyContent="spaceBetween" gap={1}>
            <SettingsTitle>
              <Trans>Signatures</Trans>
            </SettingsTitle>
            <Flex flexDirection="row" flexGrow={1} justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                startIcon={<SignIcon />}
                onClick={handleCreateSignature}
                data-testid="SettingsAdvanced-create-signature"
              >
                <Trans>Create Signature</Trans>
              </Button>
              <Button
                variant="outlined"
                startIcon={<VerifyIcon />}
                onClick={handleVerifySignature}
                data-testid="SettingsAdvanced-verify-signature"
              >
                <Trans>Verify Signature</Trans>
              </Button>
            </Flex>
          </Flex>
        </Grid>

        <Grid item container style={{ width: '400px' }} gap={2}>
          <SettingsText>
            <Trans>Prove or verify possession of a wallet address, NFT, or DID using a digital signature.</Trans>
          </SettingsText>
        </Grid>
      </Grid>

      <Grid container gap={2}>
        <Grid item style={{ width: '624px' }}>
          <Flex flexDirection="row" alignItems="center" justifyContent="spaceBetween" gap={1}>
            <SettingsTitle>
              <Trans>Resync Wallet</Trans>
            </SettingsTitle>
            <Flex flexDirection="row" flexGrow={1} justifyContent="flex-end" gap={2}>
              <Button
                onClick={() => setResyncWalletOpen(true)}
                variant="outlined"
                data-testid="SettingsPanel-resync-wallet-db"
              >
                <Trans>Resync</Trans>
              </Button>
              {resyncWalletOpen && <ResyncPrompt onSuccess={resyncWalletSucceeded} onCancel={closeResyncWallet} />}
            </Flex>
          </Flex>
        </Grid>
        <Grid item container style={{ width: '400px' }} gap={2}>
          <SettingsText>
            <Trans>
              Resyncing forces reloading data from the blockchain about your transactions without losing other locally
              stored information like open, accepted, or cancelled offer files. Resyncing will require you to restart
              the app.
            </Trans>
          </SettingsText>
        </Grid>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>
    </Grid>
  );
}

import { Button, Flex, Link } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import React from 'react';

interface WarningDialogProps {
  currentVersion: string;
  latestVersion: string;
  onClose: () => void;
  open: boolean;
  setSkipVersion: (version: string) => void;
}

function WarningDialog(props: WarningDialogProps) {
  const { onClose, open, currentVersion, latestVersion, setSkipVersion } = props;
  function handleClose() {
    onClose();
  }
  return (
    <div>
      <Dialog open={open} aria-labelledby="alert-dialog-title" fullWidth>
        <DialogTitle id="alert-dialog-title">
          <Trans>A new version of Chia Blockchain GUI is available</Trans>
        </DialogTitle>
        <DialogContent>
          <Flex flexDirection="column" gap={1}>
            <Typography variant="body2" color="textSecondary">
              <Trans>Your current version:</Trans> {currentVersion}
              <br />
              <Trans>Latest version:</Trans> {latestVersion}
              <br />
              <br />
              <Link target="_blank" href="https://www.chia.net/downloads">
                <Trans>Open downloads in the browser</Trans>
              </Link>
            </Typography>
          </Flex>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            color="primary"
            variant="outlined"
            style={{ marginBottom: '8px', marginRight: '8px' }}
          >
            <Trans>Keep reminding me</Trans>
          </Button>
          <Button
            onClick={() => setSkipVersion(latestVersion)}
            color="primary"
            variant="contained"
            style={{ marginBottom: '8px', marginRight: '8px' }}
          >
            <Trans>Skip this version</Trans>
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

interface AppVersionWarningProps {
  currentVersion: string;
  latestVersion: string;
  setVersionDialog: (isOpen: boolean) => void;
  setSkipVersion: (version: number) => void;
}

export default function AppVersionWarning(props: AppVersionWarningProps) {
  const { currentVersion, latestVersion, setVersionDialog, setSkipVersion } = props;
  const [open, setOpen] = React.useState(true);

  const handleClose = () => {
    setOpen(false);
    setVersionDialog(false);
  };

  return (
    <div>
      <WarningDialog
        open={open}
        onClose={handleClose}
        currentVersion={currentVersion}
        latestVersion={latestVersion}
        setSkipVersion={setSkipVersion}
      />
    </div>
  );
}

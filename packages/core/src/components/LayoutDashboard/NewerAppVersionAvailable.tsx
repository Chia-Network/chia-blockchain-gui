import { useLocalStorage } from '@chia-network/api-react';
import { Trans } from '@lingui/macro';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box } from '@mui/material';
import React from 'react';

import useGetLatestVersionFromWebsite from '../../hooks/useGetLatestVersionFromWebsite';
import Button from '../Button';
import Flex from '../Flex';
import Link from '../Link';
import Loading from '../Loading';

interface AppVersionWarningProps {
  currentVersion: string;
}

export default function AppVersionWarning(props: AppVersionWarningProps) {
  const { currentVersion } = props;
  const { latestVersion, isLoading: isLoadingVersion, downloadUrl } = useGetLatestVersionFromWebsite(false);
  const [open, setOpen] = React.useState<boolean>(true);
  const [, setSkipVersion] = useLocalStorage('skipVersion', '');

  function renderSpinner() {
    return (
      <Box alignItems="center" sx={{ padding: '20px 0' }}>
        <Loading center />
      </Box>
    );
  }

  function renderVersions() {
    return (
      <Flex flexDirection="column" gap={1}>
        <Typography variant="body2" color="textSecondary">
          <Trans>Your current version:</Trans> {currentVersion}
          <br />
          <Trans>Latest version:</Trans> {latestVersion}
          <br />
          <br />
          <Link target="_blank" href={downloadUrl}>
            <Trans>Open downloads in the browser</Trans>
          </Link>
        </Typography>
      </Flex>
    );
  }

  function renderUpToDate() {
    return (
      <Box sx={{ padding: '0 0 60px 0' }}>
        <Typography variant="body2" color="textSecondary">
          <Trans>Chia Blockchain {latestVersion} is currently the newest version available.</Trans>
        </Typography>
      </Box>
    );
  }

  return (
    <div>
      <Dialog open={open} aria-labelledby="alert-dialog-title" fullWidth>
        <DialogTitle id="alert-dialog-title">
          {isLoadingVersion ? (
            <Trans>Checking for updates...</Trans>
          ) : latestVersion === currentVersion ? (
            <Trans>You're up to date</Trans>
          ) : (
            <Trans>A new version of Chia Blockchain GUI is available</Trans>
          )}
        </DialogTitle>
        <DialogContent>
          {isLoadingVersion ? renderSpinner() : latestVersion === currentVersion ? renderUpToDate() : renderVersions()}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
            }}
            color="primary"
            variant="outlined"
            style={{ marginBottom: '8px', marginRight: '8px' }}
          >
            <Trans>Close dialog</Trans>
          </Button>
          {!isLoadingVersion && latestVersion !== currentVersion && (
            <Button
              onClick={() => {
                setSkipVersion(latestVersion || '');
                setOpen(false);
              }}
              color="primary"
              variant="contained"
              style={{ marginBottom: '8px', marginRight: '8px' }}
            >
              <Trans>Skip this version</Trans>
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}

import { Trans } from '@lingui/macro';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box } from '@mui/material';
import React from 'react';

import useGetLatestVersionFromWebsite from '../../hooks/useGetLatestVersionFromWebsite';
import useOpenExternal from '../../hooks/useOpenExternal';
import Button from '../Button';
import Flex from '../Flex';
import Link from '../Link';
import Loading from '../Loading';

interface AppVersionWarningProps {
  currentVersion: string;
}

export default function AppVersionWarning(props: AppVersionWarningProps) {
  const { currentVersion } = props;
  const {
    latestVersion,
    isLoading: isLoadingVersion,
    downloadUrl,
    releaseNotesUrl,
    blogUrl,
  } = useGetLatestVersionFromWebsite(false);
  const [open, setOpen] = React.useState<boolean>(true);
  const openExternal = useOpenExternal();

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
        <Flex flexDirection="row" gap={1}>
          <Typography variant="body1" color="textPrimary">
            <Trans>Your Current Version:</Trans>
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {currentVersion}
          </Typography>
        </Flex>
        <Flex flexDirection="row" gap={1}>
          <Typography variant="body1" color="textPrimary">
            <Trans>Latest Version:</Trans>
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {latestVersion}
          </Typography>
        </Flex>
        <br />
        {blogUrl && (
          <Link target="_blank" href={blogUrl}>
            <Trans>What's New</Trans>
          </Link>
        )}
        {releaseNotesUrl && (
          <Link target="_blank" href={releaseNotesUrl}>
            <Trans>Release Notes</Trans>
          </Link>
        )}
      </Flex>
    );
  }

  function renderUpToDate() {
    return (
      <Box sx={{ padding: '0 0 60px 0' }}>
        <Typography variant="body1" color="textPrimary">
          <Trans>Chia {latestVersion} is currently the latest version available.</Trans>
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
            <Trans>A new version of Chia is available!</Trans>
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
            <Trans>Close</Trans>
          </Button>
          {!isLoadingVersion && latestVersion !== currentVersion && downloadUrl && (
            <Button
              onClick={() => {
                openExternal(downloadUrl);
              }}
              color="primary"
              variant="contained"
              style={{ marginBottom: '8px', marginRight: '8px' }}
            >
              <Trans>Go To Download Page</Trans>
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}

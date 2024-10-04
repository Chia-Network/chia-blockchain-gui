import { usePrefs } from '@chia-network/api-react';
import { AlertDialog, ConfirmDialog, CopyToClipboard, Flex, useOpenDialog, useOpenExternal } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Checkbox, FormControlLabel, InputAdornment, TextField, Typography } from '@mui/material';
import React from 'react';
import isURL from 'validator/es/lib/isURL';

/* ========================================================================== */

const SuppressUnsafeLinkWarningLocalStorageKey = 'suppressUnsafeLinkWarning';

/* ========================================================================== */
type InvalidURLWarningDialogProps = {
  url: string;
};

function InvalidURLWarningDialog(props: InvalidURLWarningDialogProps) {
  const { url, ...rest } = props;

  return (
    <AlertDialog {...rest} title={<Trans>Warning: Unsupported URL</Trans>}>
      <Flex flexDirection="column" gap={2}>
        <Typography>
          <Trans>This URL is not allowed for security reasons.</Trans>
        </Typography>
        <TextField
          label={<Trans>URL</Trans>}
          value={url}
          variant="filled"
          InputProps={{
            readOnly: true,
          }}
          fullWidth
        />
      </Flex>
    </AlertDialog>
  );
}

/* ========================================================================== */

type OpenUnsafeLinkConfirmationDialogProps = {
  url: string;
};

function OpenUnsafeLinkConfirmationDialog(props: OpenUnsafeLinkConfirmationDialogProps) {
  const { url, ...rest } = props;
  const [suppressUnsafeLinkWarning, setSuppressUnsafeLinkWarning] = usePrefs<boolean>(
    SuppressUnsafeLinkWarningLocalStorageKey,
    false,
  );

  function toggleSuppression(value: boolean) {
    setSuppressUnsafeLinkWarning(value);
  }

  return (
    <ConfirmDialog
      title={<Trans>Warning: You're about to visit a website</Trans>}
      confirmTitle={<Trans>Open Link</Trans>}
      confirmColor="primary"
      cancelTitle={<Trans>Cancel</Trans>}
      {...rest}
    >
      <Flex flexDirection="column" gap={2}>
        <Typography>
          <Trans>
            Please check the following link to verify the site you are going to visit. Proceed at your own risk.
          </Trans>
        </Typography>
        <TextField
          label={<Trans>URL</Trans>}
          value={url}
          variant="filled"
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <CopyToClipboard value={url} />
              </InputAdornment>
            ),
          }}
          fullWidth
        />
        <FormControlLabel
          control={
            <Checkbox
              name="suppressUnsafeLinkWarning"
              checked={!!suppressUnsafeLinkWarning}
              onChange={(event) => toggleSuppression(event.target.checked)}
            />
          }
          label={<Trans>Do not show this dialog again</Trans>}
        />
      </Flex>
    </ConfirmDialog>
  );
}

/* ========================================================================== */

export default function useOpenUnsafeLink() {
  const openDialog = useOpenDialog();
  const openExternal = useOpenExternal();
  const [suppressUnsafeLinkWarning] = usePrefs<boolean>(SuppressUnsafeLinkWarningLocalStorageKey, false);

  async function openUnsafeLink(url: string) {
    let openUrl = false;

    if (!url) {
      return;
    }

    if (!isURL(url)) {
      await openDialog(<InvalidURLWarningDialog url={url} />);
      return;
    }

    if (suppressUnsafeLinkWarning) {
      openUrl = true;
    } else {
      openUrl = await openDialog(<OpenUnsafeLinkConfirmationDialog url={url} />);
    }

    if (openUrl) {
      openExternal(url);
    }
  }

  return openUnsafeLink;
}

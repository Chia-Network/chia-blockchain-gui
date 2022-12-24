import { Button, Flex, SettingsLabel, useOpenDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { RateReview as SignIcon, Verified as VerifyIcon } from '@mui/icons-material';
import { Grid } from '@mui/material';
import React from 'react';

import SignVerifyDialog, { SignVerifyDialogMode } from '../signVerify/SignVerifyDialog';

export default function SettingsAdvanced() {
  const openDialog = useOpenDialog();

  function handleCreateSignature() {
    openDialog(<SignVerifyDialog mode={SignVerifyDialogMode.Sign} />);
  }

  function handleVerifySignature() {
    openDialog(<SignVerifyDialog mode={SignVerifyDialogMode.Verify} />);
  }

  return (
    <Grid container>
      <Grid item xs={12} sm={6} lg={3}>
        <Flex flexDirection="column" gap={3}>
          <Flex flexDirection="column" gap={1}>
            <SettingsLabel>
              <Trans>Sign/Verify</Trans>
            </SettingsLabel>
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
    </Grid>
  );
}

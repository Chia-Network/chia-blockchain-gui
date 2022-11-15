import React from 'react';
import { Trans } from '@lingui/macro';
import { SettingsLabel, Flex, TooltipIcon } from '@chia/core';
import { FormGroup, FormControlLabel, Grid, Switch } from '@mui/material';
import useWalletConnectPrefs from '../../hooks/useWalletConnectPrefs';

export default function SettingsIntegration() {
  const { enabled, setEnabled, autoConfirm, setAutoConfirm } =
    useWalletConnectPrefs();

  return (
    <Grid container>
      <Grid item xs={12} sm={6} lg={3}>
        <Flex flexDirection="column" gap={2}>
          <SettingsLabel>
            <Flex gap={1} alignItems="center">
              <Trans>Wallet Connect</Trans>
              <TooltipIcon>
                <Trans>
                  WalletConnect is an open protocol to communicate securely
                  between mobile wallets and decentralized applications (dApps)
                  using QR code scanning (desktop) or deep linking (mobile).
                </Trans>
              </TooltipIcon>
            </Flex>
          </SettingsLabel>

          <Flex flexDirection="column" gap={1}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={enabled}
                    onChange={() => setEnabled(!enabled)}
                    inputProps={{ 'data-testid': 'Enable_Wallet_Connect' }}
                  />
                }
                label={<Trans>Enable</Trans>}
              />
            </FormGroup>

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoConfirm}
                    onChange={() => setAutoConfirm(!autoConfirm)}
                    inputProps={{
                      'data-testid': 'Enable_Wallet_Connect_Auto_Confirm',
                    }}
                  />
                }
                label={<Trans>Enable Auto Confirm</Trans>}
              />
            </FormGroup>
          </Flex>
        </Flex>
      </Grid>
    </Grid>
  );
}

import { Flex, SettingsHR, SettingsSection, SettingsTitle, SettingsText } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { FormControlLabel, Grid, Switch } from '@mui/material';
import React from 'react';

import useNotifications from '../../hooks/useNotifications';

export default function SettingsNotifications() {
  const { enabled, setEnabled } = useNotifications();

  return (
    <Grid container style={{ maxWidth: '624px' }} gap={3}>
      <Grid item>
        <Flex flexDirection="column" gap={1}>
          <SettingsSection>
            <Trans>Notifications</Trans>
          </SettingsSection>
          <SettingsText>
            <Trans>Choose your notification settings.</Trans>
          </SettingsText>
        </Flex>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid container>
        <Grid item style={{ width: '450px' }}>
          <SettingsTitle>
            <Trans>Receive push notifications when your wallet is minimized</Trans>
          </SettingsTitle>
        </Grid>
        <Grid item container xs justifyContent="flex-end" marginTop="-6px">
          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={() => setEnabled(!enabled)}
                inputProps={{ 'data-testid': 'Notifications-Pause-All' }}
              />
            }
          />
        </Grid>
        <Grid item container style={{ width: '450px' }} gap={2}>
          <SettingsText>
            <Trans>Turn on/off the ability to show you notifications on the desktop.</Trans>
          </SettingsText>
        </Grid>
      </Grid>

      {/*
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={!enabled}
                    onChange={() => setEnabled(!enabled)}
                    inputProps={{ 'data-testid': 'Notifications-Offers' }}
                  />
                }
                label={<Trans>Offers</Trans>}
              />
            </FormGroup>
              */}
    </Grid>
  );
}

import { SettingsLabel, Flex } from '@chia/core';
import { Trans } from '@lingui/macro';
import { FormGroup, FormControlLabel, Grid, Switch } from '@mui/material';
import React from 'react';

import useNotifications from '../../hooks/useNotifications';

export default function SettingsNotifications() {
  const { enabled, setEnabled } = useNotifications();

  return (
    <Grid container>
      <Grid item xs={12} lg={6}>
        <Flex flexDirection="column" gap={2}>
          <SettingsLabel>
            <Flex gap={1} alignItems="center">
              <Trans>Push Notifications</Trans>
            </Flex>
          </SettingsLabel>

          <Flex flexDirection="column" gap={1}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={!enabled}
                    onChange={() => setEnabled(!enabled)}
                    inputProps={{ 'data-testid': 'Notifications-Pause-All' }}
                  />
                }
                label={<Trans>Pause all</Trans>}
              />
            </FormGroup>

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
          </Flex>
        </Flex>
      </Grid>
    </Grid>
  );
}

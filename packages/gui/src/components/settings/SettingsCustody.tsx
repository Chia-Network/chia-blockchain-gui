import { Flex, SettingsHR, SettingsSection, SettingsText, SettingsTitle } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Grid, Switch, FormControlLabel } from '@mui/material';
import React from 'react';

import SettingsCustodyClawbackOutgoing from './SettingsCustodyClawbackOutgoing';

export default function SettingsCustody() {
  return (
    <Grid container style={{ maxWidth: '624px' }} gap={3}>
      <Grid item>
        <Flex flexDirection="column" gap={1}>
          <SettingsSection>
            <Trans>Token Protection</Trans>
          </SettingsSection>
          <SettingsText>
            <Trans>Protect your valuables by controlling the rules by which your assets - TODO fix this wording</Trans>
          </SettingsText>
        </Flex>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <SettingsTitle>
        <Trans>Default Clawback time of outgoing transactions</Trans>
      </SettingsTitle>

      <SettingsText>
        <Trans>Set a default time frame withing which you can revoke (Clawback) the transaction.</Trans>
        <br />
        <Trans>You can always change the Clawback time for a specific transaction.</Trans>
      </SettingsText>

      <SettingsCustodyClawbackOutgoing />

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid container>
        <Grid item style={{ width: '400px' }}>
          <SettingsTitle>
            <Trans>Auto claim incoming Clawback transactions</Trans>
          </SettingsTitle>
        </Grid>
        <Grid item container xs justifyContent="flex-end" marginTop="-6px">
          <FormControlLabel control={<Switch checked onChange={() => {}} />} />
        </Grid>
        <Grid item style={{ width: '400px' }}>
          <SettingsText>
            <Trans>Claim assets transferred to you automatically when the Clawback expires.</Trans>
          </SettingsText>
        </Grid>
      </Grid>
    </Grid>
  );
}

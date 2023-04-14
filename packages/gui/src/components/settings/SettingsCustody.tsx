import { Flex, SettingsHR, SettingsSection, SettingsText } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Grid } from '@mui/material';
import React from 'react';

import SettingsCustodyAutoClaim from './SettingsCustodyAutoClaim';
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

      <div>
        <SettingsSection>
          <Trans>Default Clawback time of outgoing transactions</Trans>
        </SettingsSection>

        <SettingsText>
          <Trans>Set a default time frame withing which you can revoke (Clawback) the transaction.</Trans>
          <br />
          <Trans>You can always change the Clawback time for a specific transaction.</Trans>
        </SettingsText>
      </div>

      <SettingsCustodyClawbackOutgoing sx={{ marginTop: 2.5 }} />

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <div>
        <SettingsSection>
          <Trans>Auto claim incoming Clawback transactions</Trans>
        </SettingsSection>

        <SettingsText>
          <Trans>Claim assets transferred to you automatically when the Clawback expires.</Trans>
        </SettingsText>
      </div>
      <SettingsCustodyAutoClaim sx={{ marginTop: 2.5 }} />
    </Grid>
  );
}

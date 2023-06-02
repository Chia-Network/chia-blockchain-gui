import { Flex, SettingsHR, SettingsSection, SettingsText } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Grid, Box } from '@mui/material';
import React from 'react';

import SettingsCustodyAutoClaim from './SettingsCustodyAutoClaim';
import SettingsCustodyClawbackOutgoing from './SettingsCustodyClawbackOutgoing';

export default function SettingsCustody() {
  return (
    <Grid container style={{ maxWidth: '624px' }} gap={3}>
      <Grid item>
        <Flex flexDirection="column" gap={1}>
          <SettingsSection>
            <Trans>Transaction protection</Trans>
          </SettingsSection>
          <SettingsText>
            <Trans>Features to give you more protection and control over your digital assets.</Trans>
          </SettingsText>
        </Flex>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Box>
        <SettingsSection>
          <Trans>Default claw back time for outgoing XCH transactions</Trans>
        </SettingsSection>

        <SettingsText>
          <Trans>Set a default time frame for all outbound XCH transactions.</Trans>
        </SettingsText>

        <SettingsText>
          <Trans>The claw back time can be manually adjusted per transaction.</Trans>
        </SettingsText>
      </Box>

      <SettingsCustodyClawbackOutgoing sx={{ marginTop: 2.5 }} />

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Box>
        <SettingsSection>
          <Trans>Auto claim incoming claw back transactions</Trans>
        </SettingsSection>

        <SettingsText>
          <Trans>Claim assets sent to you automatically when the claw back time period expires.</Trans>
        </SettingsText>
        <SettingsText>
          <Trans>Your wallet is required to be running for auto claim to work. </Trans>
        </SettingsText>
        <SettingsText>
          <Trans>Transactions less than the fee will not be auto claimed.</Trans>
        </SettingsText>
      </Box>
      <SettingsCustodyAutoClaim sx={{ marginTop: 1 }} />
    </Grid>
  );
}

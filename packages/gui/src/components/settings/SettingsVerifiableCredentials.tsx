import { useLocalStorage } from '@chia-network/api-react';
import { Flex, SettingsLabel } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { FormGroup, FormControlLabel, Grid, Switch } from '@mui/material';
import React from 'react';

export default function SettingsStartup() {
  const [enableVerifiableCredentials, toggleVerifiableCredentials] = useLocalStorage<boolean>(
    'enable-verifiable-credentials',
    false
  );
  return (
    <Grid container>
      <Grid item>
        <Flex flexDirection="column" gap={1}>
          <SettingsLabel>
            <Trans>Verifiable Credentials</Trans>
          </SettingsLabel>

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={enableVerifiableCredentials}
                  onChange={() => toggleVerifiableCredentials(!enableVerifiableCredentials)}
                />
              }
              label={<Trans>Enable Verifiable Credentials</Trans>}
            />
          </FormGroup>
        </Flex>
      </Grid>
    </Grid>
  );
}

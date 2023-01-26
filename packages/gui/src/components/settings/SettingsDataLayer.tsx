import { Flex, SettingsHR, SettingsSection, SettingsTitle, SettingsText } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { FormControlLabel, FormHelperText, Grid, Switch } from '@mui/material';
import React from 'react';

import useEnableDataLayerService from '../../hooks/useEnableDataLayerService';
import useEnableFilePropagationServer from '../../hooks/useEnableFilePropagationServer';

export default function SettingsDataLayer() {
  const [enableDataLayerService, setEnableDataLayerService] = useEnableDataLayerService();
  const [enableFilePropagationServer, setEnableFilePropagationServer] = useEnableFilePropagationServer();

  return (
    <Grid container style={{ maxWidth: '624px' }} gap={3}>
      <Grid item>
        <Flex flexDirection="column" gap={1}>
          <SettingsSection>
            <Trans>DataLayer Services</Trans>
          </SettingsSection>
          <SettingsText>
            <Trans>
              DataLayer enables rich data to be stored on mirrored databases that can be verified using the Chia
              Blockchain.
            </Trans>
          </SettingsText>
        </Flex>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid container>
        <Grid item style={{ width: '400px' }}>
          <SettingsTitle>
            <Trans>Enable DataLayer</Trans>
          </SettingsTitle>
        </Grid>
        <Grid item container xs justifyContent="flex-end" marginTop="-6px">
          <FormControlLabel
            control={
              <Switch
                checked={enableDataLayerService}
                onChange={() => setEnableDataLayerService(!enableDataLayerService)}
              />
            }
          />
        </Grid>
        <Grid item container style={{ width: '400px' }} gap={2}>
          <SettingsText>
            <Trans>Turn on/off the DataLayer service.</Trans>
          </SettingsText>
          <FormHelperText>
            <Trans>Changes will take effect the next time Chia is started.</Trans>
          </FormHelperText>
        </Grid>
      </Grid>

      {enableDataLayerService && (
        <div style={{ width: '624px' }}>
          <Grid container style={{ maxWidth: '624px' }} paddingBottom="10px">
            <Grid item style={{ width: '400px' }}>
              <SettingsTitle>
                <Trans>Enable File Propagation Server</Trans>
              </SettingsTitle>
            </Grid>
            <Grid item container xs justifyContent="flex-end" marginTop="-6px">
              <FormControlLabel
                control={
                  <Switch
                    checked={enableFilePropagationServer}
                    onChange={() => setEnableFilePropagationServer(!enableFilePropagationServer)}
                  />
                }
              />
            </Grid>
            <Grid item container style={{ width: '400px' }} gap={2}>
              <SettingsText>
                <Trans>A reference server that enables creating mirrored copies of DataLayer.</Trans>
              </SettingsText>
            </Grid>
          </Grid>
        </div>
      )}
    </Grid>
  );
}

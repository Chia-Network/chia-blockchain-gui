import { Flex, SettingsLabel } from '@chia/core';
import { Trans } from '@lingui/macro';
import {
  FormGroup,
  FormControlLabel,
  Grid,
  Switch,
  Typography,
} from '@mui/material';
import React from 'react';

import useEnableDataLayerService from '../../hooks/useEnableDataLayerService';
import useEnableFilePropagationServer from '../../hooks/useEnableFilePropagationServer';

export default function SettingsDataLayer() {
  const [enableDataLayerService, setEnableDataLayerService] =
    useEnableDataLayerService();
  const [enableFilePropagationServer, setEnableFilePropagationServer] =
    useEnableFilePropagationServer();

  return (
    <Grid container>
      <Grid item>
        <Flex flexDirection="column" gap={1}>
          <SettingsLabel>
            <Trans>Startup</Trans>
          </SettingsLabel>

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={enableDataLayerService}
                  onChange={() =>
                    setEnableDataLayerService(!enableDataLayerService)
                  }
                />
              }
              label={<Trans>Enable DataLayer</Trans>}
            />
            {enableDataLayerService && (
              <FormControlLabel
                control={
                  <Switch
                    checked={enableFilePropagationServer}
                    onChange={() =>
                      setEnableFilePropagationServer(
                        !enableFilePropagationServer,
                      )
                    }
                  />
                }
                label={<Trans>Enable File Propagation Server</Trans>}
              />
            )}
          </FormGroup>
          <Typography variant="body2" color="textSecondary">
            <Trans>
              Changes will take effect the next time Chia is started
            </Trans>
          </Typography>
        </Flex>
      </Grid>
    </Grid>
  );
}

import { ServiceName } from '@chia-network/api';
import {
  useGetHarvestingModeQuery,
  useUpdateHarvestingModeMutation,
  useClientStartServiceMutation,
  useClientStopServiceMutation,
} from '@chia-network/api-react';
import { ButtonLoading, Flex, SettingsHR, SettingsSection, SettingsTitle, SettingsText } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Warning as WarningIcon } from '@mui/icons-material';
import { FormControlLabel, FormHelperText, Grid, Switch, TextField, Snackbar } from '@mui/material';
import React from 'react';

const messageAnchorOrigin = { vertical: 'bottom', horizontal: 'center' };

export default function SettingsHarvester() {
  const { data, isLoading } = useGetHarvestingModeQuery();
  const [updateHarvestingMode, { isLoading: isUpdating }] = useUpdateHarvestingModeMutation();
  const [startService, { isLoading: isStarting }] = useClientStartServiceMutation();
  const [stopService, { isLoading: isStopping }] = useClientStopServiceMutation();
  const [message, setMessage] = React.useState<React.ReactElement | false>(false);

  const isProcessing = isStarting || isStopping || isUpdating || isLoading;

  const onChangeHarvestingMode = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing || !data || data.useGpuHarvesting === e.target.checked) {
        return;
      }
      updateHarvestingMode({ useGpuHarvesting: e.target.checked });
    },
    [data, updateHarvestingMode, isProcessing]
  );

  const onChangeGPUIndex = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = +e.target.value;
      if (isProcessing || !data || Number.isNaN(value) || data.gpuIndex === value) {
        return;
      }
      updateHarvestingMode({ gpuIndex: value });
    },
    [data, updateHarvestingMode, isProcessing]
  );

  const onChangeEnforceGPUIndex = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing || !data || data.enforceGpuIndex === e.target.checked) {
        return;
      }
      updateHarvestingMode({ enforceGpuIndex: e.target.checked });
    },
    [data, updateHarvestingMode, isProcessing]
  );

  const onChangeDisableCpuAffinity = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing || !data || data.disableCpuAffinity === e.target.checked) {
        return;
      }
      updateHarvestingMode({ disableCpuAffinity: e.target.checked });
    },
    [data, updateHarvestingMode, isProcessing]
  );

  const onChangeParallelDecompressorsCount = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = +e.target.value;
      if (isProcessing || !data || Number.isNaN(value) || data.parallelDecompressersCount === value) {
        return;
      }
      updateHarvestingMode({ parallelDecompressersCount: value });
    },
    [data, updateHarvestingMode, isProcessing]
  );

  const onChangeDecompresserThreadCount = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = +e.target.value;
      if (isProcessing || !data || Number.isNaN(value) || data.decompresserThreadCount === value) {
        return;
      }
      updateHarvestingMode({ decompresserThreadCount: value });
    },
    [data, updateHarvestingMode, isProcessing]
  );

  const onChangeRecursivePlotScan = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing || !data || data.recursivePlotScan === e.target.checked) {
        return;
      }
      updateHarvestingMode({ recursivePlotScan: e.target.checked });
    },
    [data, updateHarvestingMode, isProcessing]
  );

  const onChangeRefreshParameterIntervalSeconds = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = +e.target.value;
      if (isProcessing || !data || Number.isNaN(value) || data.refreshParameterIntervalSeconds === value) {
        return;
      }
      updateHarvestingMode({ refreshParameterIntervalSeconds: value });
    },
    [data, updateHarvestingMode, isProcessing]
  );

  const onClickRestartHarvester = React.useCallback(async () => {
    if (isProcessing) {
      return;
    }
    let error: unknown;
    const onError = (e: unknown) => {
      console.error(e);
      error = e;
      setMessage(<Trans>Failed to restart Harvester</Trans>);
    };
    await stopService({ service: ServiceName.HARVESTER, disableWait: true }).catch(onError);
    if (error) {
      return;
    }
    await startService({ service: ServiceName.HARVESTER, disableWait: true }).catch(onError);
    if (error) {
      return;
    }
    setMessage(<Trans>Successfully restarted Harvester</Trans>);
  }, [stopService, isProcessing, startService]);

  const onCloseMessage = React.useCallback(() => {
    setMessage(false);
  }, []);

  const harvestingModeSwitch = React.useMemo(() => {
    if (isLoading || !data) {
      return <Switch disabled />;
    }
    return (
      <Switch checked={data.useGpuHarvesting || false} onChange={onChangeHarvestingMode} readOnly={isProcessing} />
    );
  }, [data, isLoading, onChangeHarvestingMode, isProcessing]);

  const gpuIndexInput = React.useMemo(() => {
    if (isLoading || !data) {
      return <TextField size="small" type="number" disabled />;
    }
    return (
      <TextField size="small" type="number" value={data.gpuIndex} onChange={onChangeGPUIndex} disabled={isProcessing} />
    );
  }, [data, isLoading, onChangeGPUIndex, isProcessing]);

  const enforceGPUIndexSwitch = React.useMemo(() => {
    if (isLoading || !data) {
      return <Switch disabled />;
    }
    return (
      <Switch checked={data.enforceGpuIndex || false} onChange={onChangeEnforceGPUIndex} readOnly={isProcessing} />
    );
  }, [data, isLoading, onChangeEnforceGPUIndex, isProcessing]);

  const disableCpuAffinitySwitch = React.useMemo(() => {
    if (isLoading || !data) {
      return <Switch disabled />;
    }
    return (
      <Switch
        checked={data.disableCpuAffinity || false}
        onChange={onChangeDisableCpuAffinity}
        readOnly={isProcessing}
      />
    );
  }, [data, isLoading, onChangeDisableCpuAffinity, isProcessing]);

  const parallelDecompressersCountInput = React.useMemo(() => {
    if (isLoading || !data) {
      return <TextField size="small" type="number" disabled />;
    }
    return (
      <TextField
        size="small"
        type="number"
        value={data.parallelDecompressersCount}
        onChange={onChangeParallelDecompressorsCount}
        disabled={isProcessing}
      />
    );
  }, [data, isLoading, onChangeParallelDecompressorsCount, isProcessing]);

  const decompresserThreadCountInput = React.useMemo(() => {
    if (isLoading || !data) {
      return <TextField size="small" type="number" disabled />;
    }
    return (
      <TextField
        size="small"
        type="number"
        value={data.decompresserThreadCount}
        onChange={onChangeDecompresserThreadCount}
        disabled={isProcessing}
      />
    );
  }, [data, isLoading, onChangeDecompresserThreadCount, isProcessing]);

  const recursivePlotScanSwitch = React.useMemo(() => {
    if (isLoading || !data) {
      return <Switch disabled />;
    }
    return (
      <Switch checked={data.recursivePlotScan || false} onChange={onChangeRecursivePlotScan} readOnly={isProcessing} />
    );
  }, [data, isLoading, onChangeRecursivePlotScan, isProcessing]);

  const refreshParameterIntervalSecondsInput = React.useMemo(() => {
    if (isLoading || !data) {
      return <TextField size="small" type="number" disabled />;
    }
    return (
      <TextField
        size="small"
        type="number"
        value={data.refreshParameterIntervalSeconds}
        onChange={onChangeRefreshParameterIntervalSeconds}
        disabled={isProcessing}
      />
    );
  }, [data, isLoading, onChangeRefreshParameterIntervalSeconds, isProcessing]);

  return (
    <Grid container style={{ maxWidth: '624px' }} gap={3}>
      <Grid item>
        <Flex flexDirection="column" gap={1}>
          <SettingsSection>
            <Trans>Harvester Services</Trans>
          </SettingsSection>
          <SettingsText>
            <Trans>
              Harvester manages plots and fetches proofs of space corresponding to challenges sent by a farmer.
            </Trans>
          </SettingsText>
        </Flex>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <SettingsHR />
      </Grid>

      <Grid>
        <FormHelperText>
          <Trans>All changes below will take effect the next time Harvester restarts.</Trans>
        </FormHelperText>
      </Grid>

      <Grid container gap={3}>
        <Grid container>
          <Grid item style={{ width: '400px' }}>
            <SettingsTitle>
              <Trans>Recursive Plot Scan</Trans>
            </SettingsTitle>
          </Grid>
          <Grid item container xs justifyContent="flex-end" marginTop="-6px">
            <FormControlLabel control={recursivePlotScanSwitch} />
          </Grid>
          <Grid item container style={{ width: '400px' }} gap={2}>
            <SettingsText>
              <Trans>Whether to scan plots directory recursively</Trans>
            </SettingsText>
          </Grid>
        </Grid>

        <Grid container>
          <Grid item style={{ width: '400px' }}>
            <SettingsTitle>
              <Trans>Plots Refresh Interval (seconds)</Trans>
            </SettingsTitle>
          </Grid>
          <Grid item container xs justifyContent="flex-end" marginTop="-6px">
            <FormControlLabel control={refreshParameterIntervalSecondsInput} />
          </Grid>
          <Grid item container style={{ width: '400px' }} gap={2}>
            <SettingsText>
              <Trans>Interval seconds to refresh plots.</Trans>
            </SettingsText>
          </Grid>
        </Grid>

        <Grid container>
          <Grid item style={{ width: '400px' }}>
            <SettingsTitle>
              <Trans>Enable GPU Harvesting</Trans>
            </SettingsTitle>
          </Grid>
          <Grid item container xs justifyContent="flex-end" marginTop="-6px">
            <FormControlLabel control={harvestingModeSwitch} />
          </Grid>
          <Grid item container style={{ width: '400px' }} gap={2}>
            <SettingsText>
              <Trans>Enable/Disable GPU harvesting</Trans>
            </SettingsText>
          </Grid>
        </Grid>

        <Grid container>
          <Grid item style={{ width: '400px' }}>
            <SettingsTitle>
              <Trans>GPU Device Index</Trans>
            </SettingsTitle>
          </Grid>
          <Grid item container xs justifyContent="flex-end" marginTop="-6px">
            <FormControlLabel control={gpuIndexInput} />
          </Grid>
          <Grid item container style={{ width: '400px' }} gap={2}>
            <SettingsText>
              <Trans>Specify GPU device to harvest</Trans>
            </SettingsText>
          </Grid>
        </Grid>

        <Grid container style={{ display: 'none' }}>
          <Grid item style={{ width: '400px' }}>
            <SettingsTitle>
              <Trans>Enforce GPU Index</Trans>
            </SettingsTitle>
          </Grid>
          <Grid item container xs justifyContent="flex-end" marginTop="-6px">
            <FormControlLabel control={enforceGPUIndexSwitch} />
          </Grid>
          <Grid item container style={{ width: '400px' }} gap={2}>
            <SettingsText>
              <Trans>* Enabled - use device at specified index if available; else error</Trans>
              <br />
              <Trans>
                * Disabled - use device at specified index if available; if not, attempt to use device at other indices;
                if no GPUs available, use CPU
              </Trans>
            </SettingsText>
          </Grid>
        </Grid>

        <Grid container style={{ display: 'none' }}>
          <Grid item style={{ width: '400px' }}>
            <SettingsTitle>
              <Trans>Disable CPU Affinity</Trans>
            </SettingsTitle>
          </Grid>
          <Grid item container xs justifyContent="flex-end" marginTop="-6px">
            <FormControlLabel control={disableCpuAffinitySwitch} />
          </Grid>
          <Grid item container style={{ width: '400px' }} gap={2}>
            <SettingsText>
              <Trans>
                Disable assigning automatic thread affinity. This is useful when you want to manually assign thread
                affinity.
              </Trans>
            </SettingsText>
          </Grid>
        </Grid>

        <Grid container>
          <Grid item style={{ width: '400px' }}>
            <SettingsTitle>
              <Trans>Parallel Decompressors Count</Trans>
            </SettingsTitle>
          </Grid>
          <Grid item container xs justifyContent="flex-end" marginTop="-6px">
            <FormControlLabel control={parallelDecompressersCountInput} />
          </Grid>
          <Grid item container style={{ width: '400px' }} gap={2}>
            <SettingsText>
              <Trans>&lt;INSERT DESCRIPTION HERE&gt;</Trans>
            </SettingsText>
          </Grid>
        </Grid>

        <Grid container>
          <Grid item style={{ width: '400px' }}>
            <SettingsTitle>
              <Trans>Decompressor Thread Count</Trans>
            </SettingsTitle>
          </Grid>
          <Grid item container xs justifyContent="flex-end" marginTop="-6px">
            <FormControlLabel control={decompresserThreadCountInput} />
          </Grid>
          <Grid item container style={{ width: '400px' }} gap={2}>
            <SettingsText>
              <Trans>&lt;INSERT DESCRIPTION HERE&gt;</Trans>
            </SettingsText>
          </Grid>
        </Grid>

        <Grid container>
          <Grid item style={{ width: '400px' }}>
            <ButtonLoading
              onClick={onClickRestartHarvester}
              variant="contained"
              color="danger"
              data-testid="restartHarvester"
              loading={isProcessing}
              loadingPosition="start"
              startIcon={<WarningIcon />}
            >
              <Trans>Restart local harvester</Trans>
            </ButtonLoading>
            <Snackbar
              open={Boolean(message)}
              onClose={onCloseMessage}
              autoHideDuration={3000}
              message={message}
              anchorOrigin={messageAnchorOrigin}
            />
          </Grid>
          <Grid item container style={{ width: '400px', marginTop: 8 }} gap={2}>
            <SettingsText>
              <Trans>*Usually it takes seconds to complete restarting.</Trans>
            </SettingsText>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

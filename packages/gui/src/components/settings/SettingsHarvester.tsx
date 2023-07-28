import { ServiceName, HarvesterConfig } from '@chia-network/api';
import {
  useGetHarvesterConfigQuery,
  useUpdateHarvesterConfigMutation,
  useClientStartServiceMutation,
  useClientStopServiceMutation,
} from '@chia-network/api-react';
import { ButtonLoading, Flex, SettingsSection, SettingsTitle, SettingsText } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Warning as WarningIcon } from '@mui/icons-material';
import { Alert, Divider, FormControlLabel, Grid, Switch, TextField, Snackbar } from '@mui/material';
import React from 'react';

const messageAnchorOrigin = { vertical: 'bottom' as const, horizontal: 'center' as const };

export default function SettingsHarvester() {
  const { data, isLoading } = useGetHarvesterConfigQuery();
  const [updateHarvesterConfig, { isLoading: isUpdating }] = useUpdateHarvesterConfigMutation();
  const [startService, { isLoading: isStarting }] = useClientStartServiceMutation();
  const [stopService, { isLoading: isStopping }] = useClientStopServiceMutation();
  const [message, setMessage] = React.useState<React.ReactElement | false>(false);
  const [configUpdateRequests, setConfigUpdateRequests] = React.useState<HarvesterConfig>({
    useGpuHarvesting: null,
    gpuIndex: null,
    enforceGpuIndex: null,
    disableCpuAffinity: null,
    parallelDecompressorCount: null,
    decompressorThreadCount: null,
    recursivePlotScan: null,
    refreshParameterIntervalSeconds: null,
  });

  const isProcessing = isStarting || isStopping || isUpdating || isLoading;

  const onChangeEnableCompressionSupport = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing || !data) {
        return;
      }
      setConfigUpdateRequests((prev) => ({
        ...prev,
        parallelDecompressorCount: e.target.checked ? 1 : 0,
      }));
    },
    [data, setConfigUpdateRequests, isProcessing]
  );

  const onChangeHarvestingMode = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing || !data) {
        return;
      }
      setConfigUpdateRequests((prev) => ({
        ...prev,
        useGpuHarvesting: e.target.checked,
      }));
    },
    [data, setConfigUpdateRequests, isProcessing]
  );

  const onChangeGPUIndex = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = +e.target.value;
      if (isProcessing || !data || Number.isNaN(value)) {
        return;
      }
      setConfigUpdateRequests((prev) => ({
        ...prev,
        gpuIndex: value,
      }));
    },
    [data, setConfigUpdateRequests, isProcessing]
  );

  const onChangeEnforceGPUIndex = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing || !data) {
        return;
      }
      setConfigUpdateRequests((prev) => ({
        ...prev,
        enforceGpuIndex: e.target.checked,
      }));
    },
    [data, setConfigUpdateRequests, isProcessing]
  );

  const onChangeDisableCpuAffinity = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing || !data) {
        return;
      }
      setConfigUpdateRequests((prev) => ({
        ...prev,
        disableCpuAffinity: e.target.checked,
      }));
    },
    [data, setConfigUpdateRequests, isProcessing]
  );

  const onChangeParallelDecompressorCount = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = +e.target.value;
      // `value` cannot be set to a value less than or equal to 0 while `enableCompressionSupportSwitch` is turned on.
      // `value === 0` disables compressed plot support and toggling enable/disable the support must be done
      // with dedicated <Switch /> component (enableCompressionSupportSwitch).
      if (isProcessing || !data || Number.isNaN(value) || value <= 0) {
        return;
      }
      setConfigUpdateRequests((prev) => ({
        ...prev,
        parallelDecompressorCount: value,
      }));
    },
    [data, setConfigUpdateRequests, isProcessing]
  );

  const onChangeDecompressorThreadCount = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = +e.target.value;
      if (isProcessing || !data || Number.isNaN(value)) {
        return;
      }
      setConfigUpdateRequests((prev) => ({
        ...prev,
        decompressorThreadCount: value,
      }));
    },
    [data, setConfigUpdateRequests, isProcessing]
  );

  const onChangeRecursivePlotScan = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing || !data) {
        return;
      }
      setConfigUpdateRequests((prev) => ({
        ...prev,
        recursivePlotScan: e.target.checked,
      }));
    },
    [data, setConfigUpdateRequests, isProcessing]
  );

  const onChangeRefreshParameterIntervalSeconds = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = +e.target.value;
      if (isProcessing || !data || Number.isNaN(value)) {
        return;
      }
      setConfigUpdateRequests((prev) => ({
        ...prev,
        refreshParameterIntervalSeconds: value,
      }));
    },
    [data, setConfigUpdateRequests, isProcessing]
  );

  const onClickRestartHarvester = React.useCallback(async () => {
    if (isProcessing) {
      return;
    }

    let error: unknown;
    const onError = (e: unknown) => {
      console.error(e);
      error = e;
      setMessage(<Trans>Failed to update Harvester config</Trans>);
    };

    await updateHarvesterConfig({
      useGpuHarvesting: configUpdateRequests.useGpuHarvesting ?? undefined,
      gpuIndex: configUpdateRequests.gpuIndex ?? undefined,
      enforceGpuIndex: configUpdateRequests.enforceGpuIndex ?? undefined,
      disableCpuAffinity: configUpdateRequests.disableCpuAffinity ?? undefined,
      parallelDecompressorCount: configUpdateRequests.parallelDecompressorCount ?? undefined,
      decompressorThreadCount: configUpdateRequests.decompressorThreadCount ?? undefined,
      recursivePlotScan: configUpdateRequests.recursivePlotScan ?? undefined,
      refreshParameterIntervalSeconds: configUpdateRequests.refreshParameterIntervalSeconds ?? undefined,
    })
      .unwrap()
      .catch(onError);
    if (error) {
      return;
    }

    await stopService({ service: ServiceName.HARVESTER, disableWait: true }).catch(onError);
    if (error) {
      return;
    }
    await startService({ service: ServiceName.HARVESTER, disableWait: true }).catch(onError);
    if (error) {
      return;
    }
    setMessage(<Trans>Successfully restarted Harvester</Trans>);
  }, [stopService, isProcessing, startService, updateHarvesterConfig, configUpdateRequests]);

  const onCloseMessage = React.useCallback(() => {
    setMessage(false);
  }, []);

  const harvestingModeSwitch = React.useMemo(() => {
    if (isLoading || !data) {
      return <Switch disabled />;
    }
    const checked = (configUpdateRequests.useGpuHarvesting ?? data.useGpuHarvesting) || false;
    return <Switch checked={checked} onChange={onChangeHarvestingMode} readOnly={isProcessing} />;
  }, [data, isLoading, onChangeHarvestingMode, isProcessing, configUpdateRequests]);

  const gpuIndexInput = React.useMemo(() => {
    if (isLoading || !data) {
      return <TextField size="small" type="number" disabled />;
    }
    const value = configUpdateRequests.gpuIndex ?? data.gpuIndex;
    return <TextField size="small" type="number" value={value} onChange={onChangeGPUIndex} disabled={isProcessing} />;
  }, [data, isLoading, onChangeGPUIndex, isProcessing, configUpdateRequests]);

  const enforceGPUIndexSwitch = React.useMemo(() => {
    if (isLoading || !data) {
      return <Switch disabled />;
    }
    const checked = (configUpdateRequests.enforceGpuIndex ?? data.enforceGpuIndex) || false;
    return <Switch checked={checked} onChange={onChangeEnforceGPUIndex} readOnly={isProcessing} />;
  }, [data, isLoading, onChangeEnforceGPUIndex, isProcessing, configUpdateRequests]);

  const disableCpuAffinitySwitch = React.useMemo(() => {
    if (isLoading || !data) {
      return <Switch disabled />;
    }
    const checked = (configUpdateRequests.disableCpuAffinity ?? data.disableCpuAffinity) || false;
    return <Switch checked={checked} onChange={onChangeDisableCpuAffinity} readOnly={isProcessing} />;
  }, [data, isLoading, onChangeDisableCpuAffinity, isProcessing, configUpdateRequests]);

  const enableCompressionSupportSwitch = React.useMemo(() => {
    if (isLoading || !data) {
      return <Switch disabled />;
    }
    return (
      <Switch
        checked={(configUpdateRequests.parallelDecompressorCount ?? data.parallelDecompressorCount) !== 0}
        onChange={onChangeEnableCompressionSupport}
      />
    );
  }, [isLoading, data, configUpdateRequests, onChangeEnableCompressionSupport]);

  const parallelDecompressorCountInput = React.useMemo(() => {
    if (isLoading || !data) {
      return <TextField size="small" type="number" disabled />;
    }
    const value = configUpdateRequests.parallelDecompressorCount ?? data.parallelDecompressorCount;
    return (
      <TextField
        size="small"
        type="number"
        value={value}
        onChange={onChangeParallelDecompressorCount}
        disabled={isProcessing}
      />
    );
  }, [data, isLoading, onChangeParallelDecompressorCount, isProcessing, configUpdateRequests]);

  const decompressorThreadCountInput = React.useMemo(() => {
    if (isLoading || !data) {
      return <TextField size="small" type="number" disabled />;
    }
    const value = configUpdateRequests.decompressorThreadCount ?? data.decompressorThreadCount;
    return (
      <TextField
        size="small"
        type="number"
        value={value}
        onChange={onChangeDecompressorThreadCount}
        disabled={isProcessing}
      />
    );
  }, [data, isLoading, onChangeDecompressorThreadCount, isProcessing, configUpdateRequests]);

  const recursivePlotScanSwitch = React.useMemo(() => {
    if (isLoading || !data) {
      return <Switch disabled />;
    }
    const checked = (configUpdateRequests.recursivePlotScan ?? data.recursivePlotScan) || false;
    return <Switch checked={checked} onChange={onChangeRecursivePlotScan} readOnly={isProcessing} />;
  }, [data, isLoading, onChangeRecursivePlotScan, isProcessing, configUpdateRequests]);

  const refreshParameterIntervalSecondsInput = React.useMemo(() => {
    if (isLoading || !data) {
      return <TextField size="small" type="number" disabled />;
    }
    const value = configUpdateRequests.refreshParameterIntervalSeconds ?? data.refreshParameterIntervalSeconds;
    return (
      <TextField
        size="small"
        type="number"
        value={value}
        onChange={onChangeRefreshParameterIntervalSeconds}
        disabled={isProcessing}
      />
    );
  }, [data, isLoading, onChangeRefreshParameterIntervalSeconds, isProcessing, configUpdateRequests]);

  const isRestartRequired = React.useMemo(() => {
    if (!data || isLoading) {
      return false;
    }

    let ret = false;
    const updateRequestsKeys = Object.keys(configUpdateRequests) as Array<keyof HarvesterConfig>;
    for (let i = 0; i < updateRequestsKeys.length; i++) {
      const key = updateRequestsKeys[i];
      if (configUpdateRequests[key] !== null && data[key] !== configUpdateRequests[key]) {
        ret = true;
        break;
      }
    }
    return ret;
  }, [configUpdateRequests, data, isLoading]);

  const restartButton = React.useMemo(() => {
    // Show restart button when restarting harvester
    if (!isRestartRequired && !(isStarting || isStopping || isUpdating)) {
      return null;
    }
    return (
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
            disabled={!isRestartRequired || !data || isLoading}
          >
            <Trans>Restart Local Harvester to apply changes</Trans>
          </ButtonLoading>
        </Grid>
        <Grid item container style={{ width: '400px', marginTop: 8 }} gap={2}>
          <SettingsText>
            <Trans>*Usually it takes seconds to complete restarting.</Trans>
          </SettingsText>
        </Grid>
      </Grid>
    );
  }, [data, isLoading, onClickRestartHarvester, isProcessing, isRestartRequired, isStarting, isStopping, isUpdating]);

  const compressionOptionStyle = React.useMemo(
    () => (configUpdateRequests.parallelDecompressorCount === 0 ? { display: 'none' } : undefined),
    [configUpdateRequests]
  );

  return (
    <Grid container style={{ maxWidth: '624px' }} gap={3}>
      <Grid item>
        <Flex flexDirection="column" gap={1}>
          <SettingsSection>
            <Trans>Harvester Services</Trans>
          </SettingsSection>
          <SettingsText>
            <Trans>
              The Harvester manages plots and fetches proofs of space corresponding to challenges sent by a farmer.
            </Trans>
          </SettingsText>
        </Flex>
      </Grid>

      {isRestartRequired && (
        <Grid>
          <Alert severity="warning">
            <Trans>Please restart your harvester in order for any changes to take effect.</Trans>
          </Alert>
        </Grid>
      )}

      <Grid item xs={12} sm={12} lg={12}>
        <Divider textAlign="left">
          <Trans>Plot</Trans>
        </Divider>
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
              <Trans>Enable/Disable the ability to scan all subdirectories automatically for plots</Trans>
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
              <Trans>
                Interval (in seconds) in which directories are scanned to refresh the list of available plots
              </Trans>
            </SettingsText>
          </Grid>
        </Grid>

        <Grid item xs={12} sm={12} lg={12}>
          <Divider textAlign="left">
            <Trans>Compressed plot support</Trans>
          </Divider>
        </Grid>

        <Grid container>
          <Grid item style={{ width: '400px' }}>
            <SettingsTitle>
              <Trans>Enable compressed plot support</Trans>
            </SettingsTitle>
          </Grid>
          <Grid item container xs justifyContent="flex-end" marginTop="-6px">
            {enableCompressionSupportSwitch}
          </Grid>
          <Grid item container style={{ width: '400px' }} gap={2}>
            <SettingsText>
              <Trans>Turn this off if you don't have any compressed plots to harvest</Trans>
            </SettingsText>
          </Grid>
        </Grid>

        <Grid container sx={compressionOptionStyle}>
          <Grid item style={{ width: '400px' }}>
            <SettingsTitle>
              <Trans>Parallel Decompressor Count</Trans>
            </SettingsTitle>
          </Grid>
          <Grid item container xs justifyContent="flex-end" marginTop="-6px">
            <FormControlLabel control={parallelDecompressorCountInput} />
          </Grid>
          <Grid item container style={{ width: '400px' }} gap={2}>
            <SettingsText>
              <Trans>Specify a value if using CPU as your harvester. Typical values will be 1 or 2.</Trans>
            </SettingsText>
          </Grid>
        </Grid>

        <Grid container sx={compressionOptionStyle}>
          <Grid item style={{ width: '400px' }}>
            <SettingsTitle>
              <Trans>Decompressor Thread Count</Trans>
            </SettingsTitle>
          </Grid>
          <Grid item container xs justifyContent="flex-end" marginTop="-6px">
            <FormControlLabel control={decompressorThreadCountInput} />
          </Grid>
          <Grid item container style={{ width: '400px' }} gap={2}>
            <SettingsText>
              <Trans>Number of threads for a decompressor context.</Trans>
            </SettingsText>
            <SettingsText>
              *Note: Multiplying Parallel Decompressor Count and Decompressor Thread count must not exceed the number of
              CPU cores. The higher the combined value, the greater the CPU usage required.
            </SettingsText>
          </Grid>
        </Grid>

        <Grid container sx={compressionOptionStyle}>
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
              <Trans>Enable to use GPU for harvesting, disable to use CPU for harvesting.</Trans>
            </SettingsText>
          </Grid>
        </Grid>

        <Grid container sx={compressionOptionStyle}>
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
              <Trans>Specify GPU index (0, 1, 2, etc) for harvesting if more than one GPU is present)</Trans>
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

        {restartButton}
        <Snackbar
          open={Boolean(message)}
          onClose={onCloseMessage}
          autoHideDuration={3000}
          message={message}
          anchorOrigin={messageAnchorOrigin}
        />
      </Grid>
    </Grid>
  );
}

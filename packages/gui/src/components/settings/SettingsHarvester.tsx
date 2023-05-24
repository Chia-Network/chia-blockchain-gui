import { ServiceName } from '@chia-network/api';
import {
  useGetHarvestingModeQuery,
  useUpdateHarvestingModeMutation,
  useClientStopServiceMutation,
} from '@chia-network/api-react';
import { ButtonLoading, Flex, SettingsHR, SettingsSection, SettingsTitle, SettingsText } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Warning as WarningIcon } from '@mui/icons-material';
import { FormControlLabel, FormHelperText, Grid, Switch, TextField } from '@mui/material';
import React from 'react';

export default function SettingsHarvester() {
  const { data, isLoading } = useGetHarvestingModeQuery();
  const [updateHarvestingMode, { isLoading: isUpdating }] = useUpdateHarvestingModeMutation();
  const [stopService, { isLoading: isRestarting }] = useClientStopServiceMutation();

  const onChangeHarvestingMode = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isLoading || isUpdating || !data || data.useGpuHarvesting === e.target.checked) {
        return;
      }
      updateHarvestingMode({ useGpuHarvesting: e.target.checked });
    },
    [data, isLoading, updateHarvestingMode, isUpdating]
  );

  const onChangeGPUIndex = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = +e.target.value;
      if (isLoading || isUpdating || !data || Number.isNaN(value) || data.gpuIndex === value) {
        return;
      }
      updateHarvestingMode({ gpuIndex: value });
    },
    [data, isLoading, updateHarvestingMode, isUpdating]
  );

  const onChangeEnforceGPUIndex = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isLoading || isUpdating || !data || data.enforceGpuIndex === e.target.checked) {
        return;
      }
      updateHarvestingMode({ enforceGpuIndex: e.target.checked });
    },
    [data, isLoading, updateHarvestingMode, isUpdating]
  );

  const onChangeDisableCpuAffinity = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isLoading || isUpdating || !data || data.disableCpuAffinity === e.target.checked) {
        return;
      }
      updateHarvestingMode({ disableCpuAffinity: e.target.checked });
    },
    [data, isLoading, updateHarvestingMode, isUpdating]
  );

  const onChangeParallelDecompressorsCount = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = +e.target.value;
      if (isLoading || isUpdating || !data || Number.isNaN(value) || data.parallelDecompressersCount === value) {
        return;
      }
      updateHarvestingMode({ parallelDecompressersCount: value });
    },
    [data, isLoading, updateHarvestingMode, isUpdating]
  );

  const onChangeDecompresserThreadCount = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = +e.target.value;
      if (isLoading || isUpdating || !data || Number.isNaN(value) || data.decompresserThreadCount === value) {
        return;
      }
      updateHarvestingMode({ decompresserThreadCount: value });
    },
    [data, isLoading, updateHarvestingMode, isUpdating]
  );

  const onClickRestartHarvester = React.useCallback(() => {
    if (isLoading || isUpdating) {
      return;
    }
    stopService({ service: ServiceName.HARVESTER });
  }, [stopService, isLoading, isUpdating]);

  const harvestingModeSwitch = React.useMemo(() => {
    if (isLoading || !data) {
      return <Switch disabled />;
    }
    return <Switch checked={data.useGpuHarvesting || false} onChange={onChangeHarvestingMode} readOnly={isUpdating} />;
  }, [data, isLoading, onChangeHarvestingMode, isUpdating]);

  const gpuIndexInput = React.useMemo(() => {
    if (isLoading || !data) {
      return <TextField size="small" type="number" disabled />;
    }
    return (
      <TextField size="small" type="number" value={data.gpuIndex} onChange={onChangeGPUIndex} disabled={isUpdating} />
    );
  }, [data, isLoading, onChangeGPUIndex, isUpdating]);

  const enforceGPUIndexSwitch = React.useMemo(() => {
    if (isLoading || !data) {
      return <Switch disabled />;
    }
    return <Switch checked={data.enforceGpuIndex || false} onChange={onChangeEnforceGPUIndex} readOnly={isUpdating} />;
  }, [data, isLoading, onChangeEnforceGPUIndex, isUpdating]);

  const disableCpuAffinitySwitch = React.useMemo(() => {
    if (isLoading || !data) {
      return <Switch disabled />;
    }
    return (
      <Switch checked={data.disableCpuAffinity || false} onChange={onChangeDisableCpuAffinity} readOnly={isUpdating} />
    );
  }, [data, isLoading, onChangeDisableCpuAffinity, isUpdating]);

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
        disabled={isUpdating}
      />
    );
  }, [data, isLoading, onChangeParallelDecompressorsCount, isUpdating]);

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
        disabled={isUpdating}
      />
    );
  }, [data, isLoading, onChangeDecompresserThreadCount, isUpdating]);

  return (
    <Grid container style={{ maxWidth: '624px' }} gap={3}>
      <Grid item>
        <Flex flexDirection="column" gap={1}>
          <SettingsSection>
            <Trans>Harvester Services</Trans>
          </SettingsSection>
          <SettingsText>
            <Trans>
              Harvester manages plots and fetches proof of space corresponding to challenges sent by a farmer.
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
              <Trans>Enable GPU Harvesting</Trans>
            </SettingsTitle>
          </Grid>
          <Grid item container xs justifyContent="flex-end" marginTop="-6px">
            <FormControlLabel control={harvestingModeSwitch} />
          </Grid>
          <Grid item container style={{ width: '400px' }} gap={2}>
            <SettingsText>
              <Trans>Enable/Disable GPU harvesting.</Trans>
            </SettingsText>
          </Grid>
        </Grid>

        <Grid container>
          <Grid item style={{ width: '400px' }}>
            <SettingsTitle>
              <Trans>GPU device index</Trans>
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

        <Grid container>
          <Grid item style={{ width: '400px' }}>
            <SettingsTitle>
              <Trans>Enforce GPU index</Trans>
            </SettingsTitle>
          </Grid>
          <Grid item container xs justifyContent="flex-end" marginTop="-6px">
            <FormControlLabel control={enforceGPUIndexSwitch} />
          </Grid>
          <Grid item container style={{ width: '400px' }} gap={2}>
            <SettingsText>
              <Trans>
                Whether to use the specified device only. If it's turned on and no GPU is available with the specified
                index, it is an error. If it's turned off, it tries to use the device specified, or the first available,
                if any. If no device is available it defaults to CPU harvesting.
              </Trans>
            </SettingsText>
          </Grid>
        </Grid>

        <Grid container>
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
              <Trans>Parallel decompressors count</Trans>
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
              <Trans>Decompressor thread count</Trans>
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
              loading={isRestarting}
              loadingPosition="start"
              startIcon={<WarningIcon />}
            >
              <Trans>Restart local harvester</Trans>
            </ButtonLoading>
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

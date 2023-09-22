import { usePrefs } from '@chia-network/api-react';
import {
  AdvancedOptions,
  AlertDialog,
  ButtonSelected,
  CardStep,
  Flex,
  TextField,
  Checkbox,
  TooltipIcon,
  RadioGroup,
  useOpenDialog,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { FormControl, FormControlLabel, Typography, Radio } from '@mui/material';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import PlotLocalStorageKeys from '../../../constants/plotLocalStorage';
import useSelectDirectory from '../../../hooks/useSelectDirectory';
import Plotter from '../../../types/Plotter';

type Props = {
  step: number;
  plotter: Plotter;
};

export default function PlotAddSelectHybridDiskMode(props: Props) {
  const { plotter, step } = props;
  const selectDirectory = useSelectDirectory();
  const { setValue, watch } = useFormContext();
  const op = plotter.options;

  const workspaceLocation = watch('workspaceLocation');
  const hasWorkspaceLocation = !!workspaceLocation;
  const [defaultTmpDirPath, setDefaultTmpDirPath] = usePrefs<string>(PlotLocalStorageKeys.TMPDIR, '');
  const [defaultTmp2DirPath, setDefaultTmp2DirPath] = usePrefs<string>(PlotLocalStorageKeys.TMP2DIR, '');

  const workspaceLocation2 = watch('workspaceLocation2');
  const hasWorkspaceLocation2 = !!workspaceLocation2;

  const hybridDiskMode = watch('bladebitEnableHybridDiskMode', false);
  const openDialog = useOpenDialog();

  const handleSelect = React.useCallback(async () => {
    const location = await selectDirectory({ defaultPath: defaultTmpDirPath || undefined });
    if (location) {
      setValue('workspaceLocation', location, { shouldValidate: true });
      setDefaultTmpDirPath(location);
    }
  }, [selectDirectory, defaultTmpDirPath, setValue, setDefaultTmpDirPath]);

  const handleSelect2 = React.useCallback(async () => {
    const location = await selectDirectory({ defaultPath: defaultTmp2DirPath || undefined });
    if (location) {
      setValue('workspaceLocation2', location, { shouldValidate: true });
      setDefaultTmp2DirPath(location);
    }
  }, [selectDirectory, defaultTmp2DirPath, setValue, setDefaultTmp2DirPath]);

  const onChangeHybridMode = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      if (!value) {
        setValue('workspaceLocation', undefined);
        setValue('workspaceLocation2', undefined);
        setValue('bladebitEnableHybridDiskMode', false);
        return;
      }

      if (value === '128') {
        openDialog(
          <AlertDialog title={<Trans>Warning</Trans>}>
            <Trans>
              Before beginning the plotting process, ensure that you have at least 128GB of RAM available. If you are
              running low on additional memory space, we strongly advise closing all other applications to prevent
              memory errors.
            </Trans>
          </AlertDialog>
        );
      }
      setValue('bladebitEnableHybridDiskMode', value);
    },
    [setValue, openDialog]
  );

  return (
    <CardStep step={step} title={<Trans>Select Hybrid disk mode</Trans>}>
      <Typography variant="subtitle1">
        <Trans>
          Hybrid disk mode allows computers with lower amounts of RAM to plot by offloading intermediate data to disk.
          If you enable hybrid disk mode, you need to specify temp folder(s). We recommend using SSDs when supporting a
          hybrid disk mode.
        </Trans>
      </Typography>

      <Flex gap={2}>
        <RadioGroup name="bladebitEnableHybridDiskMode" onChange={onChangeHybridMode} defaultValue="">
          <FormControlLabel value="" label={<Trans>Normal (RAM required: 256G)</Trans>} control={<Radio />} />
          <FormControlLabel
            value="128"
            label={<Trans>Hybrid disk mode 1 (RAM required: 128G)</Trans>}
            control={<Radio />}
          />
        </RadioGroup>
      </Flex>

      {hybridDiskMode && (
        <>
          <Flex gap={2}>
            <TextField
              onClick={handleSelect}
              fullWidth
              label={<Trans>Temporary folder location</Trans>}
              name="workspaceLocation"
              inputProps={{
                readOnly: true,
              }}
              variant="filled"
              rules={{
                minLength: {
                  value: 1,
                  message: <Trans>Please specify temporary directory</Trans>,
                },
                required: {
                  value: true,
                  message: <Trans>Please specify temporary directory</Trans>,
                },
              }}
              required
            />
            <ButtonSelected
              onClick={handleSelect}
              size="large"
              variant="outlined"
              selected={hasWorkspaceLocation}
              nowrap
            >
              {hasWorkspaceLocation ? <Trans>Selected</Trans> : <Trans>Browse</Trans>}
            </ButtonSelected>
          </Flex>
          {op.haveBladebitDiskNoT1Direct && (
            <FormControl variant="filled" fullWidth>
              <FormControlLabel
                control={<Checkbox name="bladebitDiskNoT1Direct" />}
                label={
                  <>
                    <Trans>The folder is on a RAM Disk</Trans>{' '}
                    <TooltipIcon>
                      <Trans>
                        Disable direct I/O on the temp 1 directory in order to extract maximum performance with RAM disk
                      </Trans>
                    </TooltipIcon>
                  </>
                }
              />
            </FormControl>
          )}

          <AdvancedOptions>
            <Flex flexDirection="column" gap={2}>
              <Typography variant="h6">
                <Trans>Select 2nd Temporary Directory</Trans>
              </Typography>
              <Flex gap={2}>
                <TextField
                  onClick={handleSelect2}
                  fullWidth
                  label={<Trans>Second temporary folder location</Trans>}
                  name="workspaceLocation2"
                  inputProps={{
                    readOnly: true,
                  }}
                  variant="filled"
                />
                <ButtonSelected
                  onClick={handleSelect2}
                  size="large"
                  variant="outlined"
                  color="secondary"
                  selected={hasWorkspaceLocation2}
                  nowrap
                >
                  {hasWorkspaceLocation2 ? <Trans>Selected</Trans> : <Trans>Browse</Trans>}
                </ButtonSelected>
              </Flex>
              <Typography color="textSecondary">
                <Trans>If none selected, then it will default to the temporary directory.</Trans>
              </Typography>
            </Flex>
            {op.haveBladebitDiskNoT2Direct && (
              <FormControl variant="filled" fullWidth>
                <FormControlLabel
                  control={<Checkbox name="bladebitDiskNoT2Direct" />}
                  label={
                    <>
                      <Trans>The folder is on a RAM Disk</Trans>{' '}
                      <TooltipIcon>
                        <Trans>
                          Disable direct I/O on the temp 2 directory in order to extract maximum performance with RAM
                          disk
                        </Trans>
                      </TooltipIcon>
                    </>
                  }
                />
              </FormControl>
            )}
          </AdvancedOptions>
        </>
      )}
    </CardStep>
  );
}

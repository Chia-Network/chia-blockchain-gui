import { usePrefs } from '@chia-network/api-react';
import { ButtonSelected, CardStep, Flex, TextField } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import PlotLocalStorageKeys from '../../../constants/plotLocalStorage';
import useSelectDirectory from '../../../hooks/useSelectDirectory';
import Plotter from '../../../types/Plotter';
import PlotAddSelectTemporaryDirectory from './PlotAddSelectTemporaryDirectory';

type Props = {
  step: number;
  plotter: Plotter;
};

export default function PlotAddSelectFinalDirectory(props: Props) {
  const { step, plotter } = props;
  const allowTempDirSelection = plotter.options.haveTempDir === true;
  const selectDirectory = useSelectDirectory();
  const { setValue, watch } = useFormContext();

  const finalLocation = watch('finalLocation');
  const hasFinalLocation = !!finalLocation;
  const [defaultFinalDirPath, setDefaultFinalDirPath] = usePrefs<string>(PlotLocalStorageKeys.FINALDIR);

  async function handleSelect() {
    const location = await selectDirectory({ defaultPath: defaultFinalDirPath || undefined });
    if (location) {
      setValue('finalLocation', location, { shouldValidate: true });
      setDefaultFinalDirPath(location);
    }
  }

  return (
    <CardStep
      step={step}
      title={allowTempDirSelection ? <Trans>Select Temp/Final Directory</Trans> : <Trans>Select Final Directory</Trans>}
    >
      {allowTempDirSelection && <PlotAddSelectTemporaryDirectory plotter={plotter} />}
      <Typography variant="subtitle1">
        <Trans>
          Select the final destination for the folder where you would like the plot to be stored. We recommend you use a
          large slow hard drive (like external HDD).
        </Trans>
      </Typography>

      <Flex gap={2}>
        <TextField
          onClick={handleSelect}
          fullWidth
          label={<Trans>Final folder location</Trans>}
          name="finalLocation"
          inputProps={{
            readOnly: true,
          }}
          variant="filled"
          rules={{
            minLength: {
              value: 1,
              message: <Trans>Please specify final directory</Trans>,
            },
            required: {
              value: true,
              message: <Trans>Please specify final directory</Trans>,
            },
          }}
          required
        />
        <ButtonSelected
          onClick={handleSelect}
          size="large"
          variant="outlined"
          color="secondary"
          selected={hasFinalLocation}
          nowrap
        >
          {hasFinalLocation ? <Trans>Selected</Trans> : <Trans>Browse</Trans>}
        </ButtonSelected>
      </Flex>
    </CardStep>
  );
}

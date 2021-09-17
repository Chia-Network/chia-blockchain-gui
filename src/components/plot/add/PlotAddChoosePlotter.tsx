import React from 'react';
import { useSelector } from 'react-redux';
import { useFormContext } from 'react-hook-form';
import { Trans } from '@lingui/macro';
import { CardStep, Select } from '@chia/core';
import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Typography,
} from '@material-ui/core';
import { RootState } from '../../../modules/rootReducer';
import Plotters from '../../../constants/Plotters';
import PlotterNames from '../../../constants/PlotterNames';

type Props = {
  step: number;
  onChange: (plotter: PlotterNames) => void;
};

export default function PlotAddChoosePlotter(props: Props) {
  const { step, onChange } = props;
  const { watch, reset, getValues, setValue } = useFormContext();
  const plotterName: string = watch('plotterName');
  const availablePlotters = useSelector((state: RootState) => state.plotter_configuration.available_plotters);
  const displayedPlotters = availablePlotters.map((plotterName) => {
    return {
      ...Plotters[plotterName as PlotterNames],
      _plotterName: plotterName,
    };
  });

  // Sort chiapos to the front of the list as a default
  displayedPlotters.sort((a, b) => a._plotterName == PlotterNames.CHIAPOS ? -1 : a._plotterName.localeCompare(b._plotterName));

  const handleChange = (event: any) => {
    console.log("handleChange called: " + event.target.value);
    // const values = getValues();
    // values.plotterName = event.target.value;
    // values.numBuckets += 100;
    // reset(values);
    const plotterName: PlotterNames = event.target.value as PlotterNames;
    onChange(plotterName);
    // console.log(values);
    // setValue('plotterName', event.target.value);
  };

  return (
    <CardStep step={step} title={<Trans>Choose Plotter</Trans>}>
      <Typography variant="subtitle1">
        <Trans>
          {
            `
            Depending on your system configuration, you may find that an alternative plotter
            produces plots faster than the default Chia Proof of Space plotter. If unsure,
            use the default Chia Proof of Space plotter.
            `
          }
        </Trans>
      </Typography>

      <Grid container>
        <Grid xs={12} sm={10} md={8} lg={6} item>
          <FormControl variant="filled" fullWidth>
            <InputLabel required focused>
              <Trans>Plotter</Trans>
            </InputLabel>
            <Select
              name="plotterName"
              onChange={handleChange}
              value={plotterName}
            >
              { displayedPlotters.map((plotter) => (
                <MenuItem value={plotter._plotterName} key={plotter._plotterName}>
                  {plotter.displayName + " " + plotter.version}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CardStep>
  )
}

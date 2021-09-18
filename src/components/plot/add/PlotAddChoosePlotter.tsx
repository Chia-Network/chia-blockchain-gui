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
import PlotterName from '../../../constants/PlotterNames';
import { defaultPlotter } from '../../../modules/plotterConfiguration';

type Props = {
  step: number;
  onChange: (plotter: PlotterName) => void;
};

export default function PlotAddChoosePlotter(props: Props) {
  const { step, onChange } = props;
  const { watch, reset, getValues, setValue } = useFormContext();
  const plotterName: PlotterName = watch('plotterName');
  const { availablePlotters } = useSelector((state: RootState) => state.plotter_configuration);
  const displayedPlotters = Object.keys(availablePlotters) as PlotterName[]
  
  // Sort chiapos to the top of the list
  displayedPlotters.sort((a, b) => a == PlotterName.CHIAPOS ? -1 : a.localeCompare(b));

  const handleChange = async (event: any) => {
    const selectedPlotterName: PlotterName = event.target.value as PlotterName;
    onChange(selectedPlotterName);
  };

  const plotterDisplayName = (plotterName: PlotterName): string => {
    const plotter = availablePlotters[plotterName] ?? defaultPlotter();
    const { version } = plotter;
    return plotter.displayName + (version ? (" " + version) : "");
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
                <MenuItem value={plotter} key={plotter}>
                  {plotterDisplayName(plotter)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CardStep>
  )
}

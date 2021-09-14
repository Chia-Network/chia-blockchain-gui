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

type Props = {
  step: number
};

export default function PlotAddChoosePlotter(props: Props) {
  const { step } = props;
  const { watch, setValue } = useFormContext();
  const availablePlotters = useSelector((state: RootState) => state.plotter_configuration.available_plotters);
  const taggedPlotters = availablePlotters.map((plotter) => {
    return {
      ...plotter,
      tag: {
        'Chia Proof of Space': 'chiapos',
        'madMAx43v3r Chia Plotter': 'madmax',
        'BladeBit Chia Plotter': 'bladebit',
      }[plotter.plotter_display_name] }
  });
  const plotter = watch('plotter');

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
            <Select name="plotter">
              { taggedPlotters.map((plotter) => (
                <MenuItem value={plotter.tag} key={plotter.tag}>
                  {plotter.plotter_display_name + " " + plotter.plotter_version}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CardStep>
  )
}

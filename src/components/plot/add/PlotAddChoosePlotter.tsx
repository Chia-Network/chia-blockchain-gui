import React from 'react';
import { useSelector } from 'react-redux';
import { useFormContext } from 'react-hook-form';
import { t, Trans } from '@lingui/macro';
import { CardStep, Select } from '@chia/core';
import {
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Typography,
} from '@material-ui/core';
import { RootState } from '../../../modules/rootReducer';
import PlotterName from '../../../constants/PlotterNames';
import StateColor from '../../core/constants/StateColor';
import styled from 'styled-components';
import { defaultPlotter } from '../../../modules/plotterConfiguration';

type Props = {
  step: number;
  onChange: (plotter: PlotterName) => void;
};

const StyledFormHelperText = styled(FormHelperText)`
  color: ${StateColor.WARNING};
`;

export default function PlotAddChoosePlotter(props: Props) {
  const { step, onChange } = props;
  const { watch } = useFormContext();
  const plotterName: PlotterName = watch('plotterName');
  const { availablePlotters } = useSelector((state: RootState) => state.plotter_configuration);
  const displayedPlotters = Object.keys(availablePlotters) as PlotterName[]
  const installed = availablePlotters[plotterName]?.installInfo?.installed ?? false;
  
  // Sort chiapos to the top of the list
  displayedPlotters.sort((a, b) => a == PlotterName.CHIAPOS ? -1 : a.localeCompare(b));

  const handleChange = async (event: any) => {
    const selectedPlotterName: PlotterName = event.target.value as PlotterName;
    onChange(selectedPlotterName);
  };

  const isPlotterSupported = (plotterName: PlotterName): boolean => {
    const installed = availablePlotters[plotterName]?.installInfo?.installed ?? false;
    const supported = installed || (availablePlotters[plotterName]?.installInfo?.canInstall ?? false);
    return supported;
  }

  const plotterDisplayName = (plotterName: PlotterName): string => {
    const plotter = availablePlotters[plotterName] ?? defaultPlotter();
    const { version } = plotter;
    const installed = plotter.installInfo?.installed;
    let displayName = plotter.displayName;

    if (version) {
      displayName += " " + version;
    }

    if (!isPlotterSupported(plotterName)) {
      displayName += " " + t`(Not Supported)`;
    }
    else if (!installed) {
      displayName += " " + t`(Not Installed)`;
    }

    return displayName;
  };

  const plotterWarningString = (plotterName: PlotterName): string | undefined => {
    if (plotterName === PlotterName.BLADEBIT) {
      return availablePlotters[PlotterName.BLADEBIT]?.installInfo?.bladebitMemoryWarning;
    }
    return undefined;
  };

  const warning = plotterWarningString(plotterName);

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
                <MenuItem value={plotter} key={plotter} disabled={!isPlotterSupported(plotter)}>
                  {plotterDisplayName(plotter)}
                </MenuItem>
              ))}
            </Select>
            {!installed && (
              <StyledFormHelperText>
                <Trans>The selected plotter will be installed when plot creation begins</Trans>
              </StyledFormHelperText>
            )}
            {warning && (
              <StyledFormHelperText>
                <Trans>{warning}</Trans>
              </StyledFormHelperText>
            )}
          </FormControl>
        </Grid>
      </Grid>
    </CardStep>
  )
}

import { CardStep, ConfirmDialog, Link, Select, StateColor, useOpenDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Grid, FormControl, Typography, InputLabel, MenuItem, FormHelperText } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';

import { getPlotSizeOptions } from '../../../constants/plotSizes';
import Plotter from '../../../types/Plotter';

const MIN_MAINNET_K_SIZE = 32;

const StyledFormHelperText = styled(FormHelperText)`
  color: ${StateColor.WARNING};
`;

type Props = {
  step: number;
  plotter: Plotter;
};

export default function PlotAddChooseSize(props: Props) {
  const { step, plotter } = props;
  const { watch, setValue } = useFormContext();
  const openDialog = useOpenDialog();

  const op = plotter.options;
  const isBladebit3OrNewer =
    plotter.defaults.plotterName.startsWith('bladebit') && plotter.version && +plotter.version.split('.')[0] >= 3;

  const plotterName = watch('plotterName');
  const plotSize = watch('plotSize');
  const overrideK = watch('overrideK');
  const compressionLevelStr = watch('bladebitCompressionLevel');
  const compressionLevel = compressionLevelStr ? +compressionLevelStr : undefined;
  const isKLow = plotSize < MIN_MAINNET_K_SIZE;

  const compressionAvailable = op.haveBladebitCompressionLevel && isBladebit3OrNewer;

  const [allowedPlotSizes, setAllowedPlotSizes] = useState(
    getPlotSizeOptions(plotterName, compressionLevel).filter((option) => plotter.options.kSizes.includes(option.value))
  );

  useEffect(() => {
    setAllowedPlotSizes(
      getPlotSizeOptions(plotterName, compressionLevel).filter((option) =>
        plotter.options.kSizes.includes(option.value)
      )
    );
  }, [plotter.options.kSizes, plotterName, compressionLevel]);

  useEffect(() => {
    async function getConfirmation() {
      const canUse = await openDialog(
        <ConfirmDialog
          title={<Trans>The minimum required size for mainnet is k=32</Trans>}
          confirmTitle={<Trans>Yes</Trans>}
          confirmColor="danger"
        >
          <Trans>Are you sure you want to use k={plotSize}?</Trans>
        </ConfirmDialog>
      );

      if (canUse) {
        setValue('overrideK', true);
      } else {
        setValue('plotSize', 32);
      }
    }

    if (plotSize === 25) {
      if (!overrideK) {
        getConfirmation();
      }
    } else {
      setValue('overrideK', false);
    }
  }, [plotSize, overrideK, setValue, openDialog]);

  return (
    <CardStep
      step={step}
      title={compressionAvailable ? <Trans>Choose K value and compression level</Trans> : <Trans>Choose K value</Trans>}
    >
      <Typography variant="subtitle1">
        <Trans>
          {
            'You do not need to be synced or connected to plot. Temporary files are created during the plotting process which exceed the size of the final plot files. Make sure you have enough space. '
          }
          <Link target="_blank" href="https://github.com/Chia-Network/chia-blockchain/wiki/k-sizes">
            Learn more
          </Link>
        </Trans>
      </Typography>

      <Grid container spacing={2} direction="column">
        <Grid xs={12} sm={10} md={8} lg={8} item>
          <FormControl variant="filled" fullWidth>
            <InputLabel required focused>
              <Trans>K value</Trans>
            </InputLabel>
            <Select name="plotSize">
              {allowedPlotSizes.map((option) => (
                <MenuItem value={option.value} key={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {isKLow && (
              <StyledFormHelperText>
                <Trans>The minimum required size for mainnet is k=32</Trans>
              </StyledFormHelperText>
            )}
          </FormControl>
        </Grid>
        {compressionAvailable && (
          <Grid xs={12} sm={12} item>
            <FormControl variant="filled" fullWidth>
              <InputLabel>
                <Trans>Compression level</Trans>
              </InputLabel>
              <Select name="bladebitCompressionLevel" defaultValue={plotter.defaults.bladebitCompressionLevel}>
                <MenuItem value={0}>0 - No compression</MenuItem>
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={4}>4</MenuItem>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={6}>6</MenuItem>
                <MenuItem value={7}>7</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>
    </CardStep>
  );
}

import {
  AdvancedOptions,
  CardStep,
  TextField,
  RadioGroup,
  Flex,
  Checkbox,
  TooltipIcon,
  Select,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import {
  Grid,
  FormControl,
  InputAdornment,
  Typography,
  FormControlLabel,
  Radio,
  MenuItem,
  InputLabel,
} from '@mui/material';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import PlotterName from '../../../constants/PlotterName';
import Plotter from '../../../types/Plotter';

type Props = {
  step: number;
  plotter: Plotter;
};

export default function PlotAddNumberOfPlots(props: Props) {
  const { step, plotter } = props;
  const { watch } = useFormContext();
  const parallel = watch('parallel');

  const op = plotter.options;

  return (
    <CardStep step={step} title={<Trans>Options</Trans>}>
      <Grid spacing={2} direction="column" container>
        <Grid xs={12} md={8} lg={6} item>
          <FormControl variant="filled" fullWidth>
            <TextField
              required
              name="plotCount"
              type="number"
              variant="filled"
              placeholder=""
              label={<Trans>Plot Count</Trans>}
              InputProps={{
                inputProps: { min: 1 },
              }}
            />
          </FormControl>
        </Grid>

        {op.canPlotInParallel && (
          <Grid xs={12} md={8} lg={6} item>
            <Typography>
              <Trans>Does your machine support parallel plotting?</Trans>
            </Typography>
            <Typography color="textSecondary">
              <Trans>Plotting in parallel can save time. Otherwise, add plot(s) to the queue.</Trans>
            </Typography>

            <FormControl variant="filled" fullWidth>
              <RadioGroup name="parallel" boolean>
                <Flex gap={2} flexWrap="wrap">
                  <FormControlLabel value={false} control={<Radio />} label={<Trans>Add Plot to Queue</Trans>} />
                  <FormControlLabel control={<Radio />} label={<Trans>Plot in Parallel</Trans>} value />
                </Flex>
              </RadioGroup>
            </FormControl>
          </Grid>
        )}

        {parallel && (
          <Grid xs={12} md={8} lg={6} item>
            <FormControl variant="filled">
              <Typography variant="subtitle1">
                <Trans>Want to have a delay before the next plot starts?</Trans>
              </Typography>
              <TextField
                name="delay"
                type="number"
                variant="filled"
                label={<Trans>Delay</Trans>}
                InputProps={{
                  inputProps: { min: 0 },
                  endAdornment: (
                    <InputAdornment position="end">
                      <Trans>Minutes</Trans>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
          </Grid>
        )}
      </Grid>

      <AdvancedOptions>
        <Grid spacing={1} container>
          {op.canSetBufferSize && (
            <Grid xs={12} sm={6} item>
              <FormControl fullWidth>
                <TextField
                  name="maxRam"
                  type="number"
                  variant="filled"
                  label={<Trans>RAM max usage</Trans>}
                  helperText={<Trans>More memory slightly increases speed</Trans>}
                  InputProps={{
                    inputProps: { min: 0 },
                    endAdornment: <InputAdornment position="end">MiB</InputAdornment>,
                  }}
                />
              </FormControl>
            </Grid>
          )}
          <Grid xs={12} sm={6} item>
            <FormControl fullWidth>
              <TextField
                name="numThreads"
                type="number"
                variant="filled"
                placeholder="2"
                label={<Trans>Number of threads</Trans>}
                helperText={
                  (plotter.defaults.plotterName === PlotterName.BLADEBIT_RAM ||
                    plotter.defaults.plotterName === PlotterName.BLADEBIT_DISK) && (
                    <Trans>Specify a value of 0 to use all available threads</Trans>
                  )
                }
                InputProps={{
                  inputProps: { min: 0 },
                }}
              />
            </FormControl>
          </Grid>
          {op.haveMadmaxThreadMultiplier && (
            <Grid xs={12} sm={6} item>
              <FormControl fullWidth>
                <TextField
                  name="madmaxThreadMultiplier"
                  type="number"
                  variant="filled"
                  placeholder=""
                  label={<Trans>Thread Multiplier for Phase 2</Trans>}
                  helperText={<Trans>A value of {plotter.defaults.madmaxThreadMultiplier} is recommended</Trans>}
                  InputProps={{
                    inputProps: { min: 0 },
                  }}
                />
              </FormControl>
            </Grid>
          )}
          {op.haveNumBuckets && plotter.defaults.plotterName !== PlotterName.BLADEBIT_DISK && (
            <Grid xs={12} sm={6} item>
              <FormControl variant="filled" fullWidth>
                <TextField
                  name="numBuckets"
                  type="number"
                  variant="filled"
                  placeholder=""
                  label={<Trans>Number of buckets</Trans>}
                  helperText={<Trans>{plotter.defaults.numBuckets} buckets is recommended</Trans>}
                  InputProps={{
                    inputProps: { min: 0 },
                  }}
                />
              </FormControl>
            </Grid>
          )}
          {op.haveNumBuckets && plotter.defaults.plotterName === PlotterName.BLADEBIT_DISK && (
            <Grid xs={12} sm={6} item>
              <FormControl variant="filled" fullWidth>
                <InputLabel>
                  <Trans>Number of buckets</Trans>
                </InputLabel>
                <Select name="numBuckets" defaultValue={plotter.defaults.numBuckets}>
                  <MenuItem value={64}>64</MenuItem>
                  <MenuItem value={128}>128</MenuItem>
                  <MenuItem value={256}>256</MenuItem>
                  <MenuItem value={512}>512</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
          {op.haveMadmaxNumBucketsPhase3 && (
            <Grid xs={12} sm={6} item>
              <FormControl variant="filled" fullWidth>
                <TextField
                  name="madmaxNumBucketsPhase3"
                  type="number"
                  variant="filled"
                  placeholder=""
                  label={<Trans>Number of buckets for phase 3 &amp; 4</Trans>}
                  helperText={<Trans>{plotter.defaults.madmaxNumBucketsPhase3} buckets is recommended</Trans>}
                  InputProps={{
                    inputProps: { min: 0 },
                  }}
                />
              </FormControl>
            </Grid>
          )}
          <Grid xs={12} sm={6} item>
            <FormControl variant="filled" fullWidth>
              <TextField
                name="queue"
                type="text"
                variant="filled"
                placeholder="default"
                label={<Trans>Queue Name</Trans>}
                helperText={<Trans>Plots in the same queue will run in serial</Trans>}
              />
            </FormControl>
          </Grid>
          {(op.haveBladebitDiskCache ||
            op.haveBladebitDiskF1Threads ||
            op.haveBladebitDiskFpThreads ||
            op.haveBladebitDiskCThreads ||
            op.haveBladebitDiskP2Threads ||
            op.haveBladebitDiskP3Threads) && (
            <Grid container item spacing={1}>
              {op.haveBladebitDiskCache && (
                <Grid xs={12} sm={6} item>
                  <FormControl variant="filled" fullWidth>
                    <TextField
                      name="bladebitDiskCache"
                      type="number"
                      variant="filled"
                      placeholder="192"
                      label={<Trans>Cache size (GB)</Trans>}
                      InputProps={{
                        inputProps: { min: 0 },
                      }}
                      helperText={<Trans>Size of cache to reserve for I/O</Trans>}
                    />
                  </FormControl>
                </Grid>
              )}
              {op.haveBladebitDiskF1Threads && (
                <Grid xs={12} sm={6} item>
                  <FormControl variant="filled" fullWidth>
                    <TextField
                      name="bladebitDiskF1Threads"
                      type="number"
                      variant="filled"
                      placeholder=""
                      label={<Trans>Number of threads for F1 generation</Trans>}
                      helperText={<Trans>Override the thread count for F1 generation</Trans>}
                    />
                  </FormControl>
                </Grid>
              )}
              {op.haveBladebitDiskFpThreads && (
                <Grid xs={12} sm={6} item>
                  <FormControl variant="filled" fullWidth>
                    <TextField
                      name="bladebitDiskFpThreads"
                      type="number"
                      variant="filled"
                      placeholder=""
                      label={<Trans>Number of threads for forward propagation</Trans>}
                      helperText={<Trans>Override the thread count for forward propagation</Trans>}
                    />
                  </FormControl>
                </Grid>
              )}
              {op.haveBladebitDiskCThreads && (
                <Grid xs={12} sm={6} item>
                  <FormControl variant="filled" fullWidth>
                    <TextField
                      name="bladebitDiskCThreads"
                      type="number"
                      variant="filled"
                      placeholder=""
                      label={<Trans>Number of threads for C table processing</Trans>}
                      helperText={<Trans>Override the thread count for C table processing</Trans>}
                    />
                  </FormControl>
                </Grid>
              )}
              {op.haveBladebitDiskP2Threads && (
                <Grid xs={12} sm={6} item>
                  <FormControl variant="filled" fullWidth>
                    <TextField
                      name="bladebitDiskP2Threads"
                      type="number"
                      variant="filled"
                      placeholder=""
                      label={<Trans>Number of threads for Phase 2</Trans>}
                      helperText={<Trans>Override the thread count for Phase 2</Trans>}
                    />
                  </FormControl>
                </Grid>
              )}
              {op.haveBladebitDiskP3Threads && (
                <Grid xs={12} sm={6} item>
                  <FormControl variant="filled" fullWidth>
                    <TextField
                      name="bladebitDiskP3Threads"
                      type="number"
                      variant="filled"
                      placeholder=""
                      label={<Trans>Number of threads for Phase 3</Trans>}
                      helperText={<Trans>Override the thread count for Phase 3</Trans>}
                    />
                  </FormControl>
                </Grid>
              )}
            </Grid>
          )}
          {op.canDisableBitfieldPlotting && (
            <Grid xs={12} item>
              <FormControl variant="filled" fullWidth>
                <FormControlLabel
                  control={<Checkbox name="disableBitfieldPlotting" />}
                  label={
                    <>
                      <Trans>Disable bitfield plotting</Trans>{' '}
                      <TooltipIcon>
                        <Trans>
                          Plotting with bitfield enabled has about 30% less overall writes and is now almost always
                          faster. You may see reduced memory requirements with bitfield plotting disabled. If your CPU
                          design is from before 2010 you may have to disable bitfield plotting.
                        </Trans>
                      </TooltipIcon>
                    </>
                  }
                />
              </FormControl>
            </Grid>
          )}
          {op.haveMadmaxTempToggle && (
            <Grid xs={12} item>
              <FormControl variant="filled" fullWidth>
                <FormControlLabel
                  control={<Checkbox name="madmaxTempToggle" />}
                  label={
                    <>
                      <Trans>Alternate tmpdir/tmpdir2</Trans>{' '}
                    </>
                  }
                />
              </FormControl>
            </Grid>
          )}
          <Grid container item spacing={1}>
            {op.haveBladebitWarmStart && (
              <Grid xs={6} sm={4} item>
                <FormControl variant="filled" fullWidth>
                  <FormControlLabel
                    control={<Checkbox name="bladebitWarmStart" />}
                    label={
                      <>
                        <Trans>Warm start</Trans>
                        <TooltipIcon>
                          <Trans>Touch all pages of buffer allocations before starting to plot.</Trans>
                        </TooltipIcon>
                      </>
                    }
                  />
                </FormControl>
              </Grid>
            )}
            {op.haveBladebitDisableNUMA && (
              <Grid xs={6} sm={4} item>
                <FormControl variant="filled" fullWidth>
                  <FormControlLabel
                    control={<Checkbox name="bladebitDisableNUMA" />}
                    label={
                      <>
                        <Trans>Disable NUMA</Trans>{' '}
                        <TooltipIcon>
                          <Trans>
                            Disable automatic NUMA aware memory binding. If you set this parameter in a NUMA system you
                            will likely get degraded performance.
                          </Trans>
                        </TooltipIcon>
                      </>
                    }
                  />
                </FormControl>
              </Grid>
            )}
            {op.haveBladebitNoCpuAffinity && (
              <Grid xs={6} sm={4} item>
                <FormControl variant="filled" fullWidth>
                  <FormControlLabel
                    control={<Checkbox name="bladebitNoCpuAffinity" />}
                    label={
                      <>
                        <Trans>No CPU Affinity</Trans>{' '}
                        <TooltipIcon>
                          <Trans>
                            Disable assigning automatic thread affinity. This is useful when running multiple
                            simultaneous instances of Bladebit as you can manually assign thread affinity yourself when
                            launching Bladebit.
                          </Trans>
                        </TooltipIcon>
                      </>
                    }
                  />
                </FormControl>
              </Grid>
            )}
            {op.haveBladebitDiskAlternate && (
              <Grid xs={6} sm={4} item>
                <FormControl variant="filled" fullWidth>
                  <FormControlLabel
                    control={<Checkbox name="bladebitDiskAlternate" />}
                    label={
                      <>
                        <Trans>Alternate bucket writing</Trans>{' '}
                        <TooltipIcon>
                          <Trans>
                            Halves the temp2 cache size requirements by alternating bucket writing methods between
                            tables.
                          </Trans>
                        </TooltipIcon>
                      </>
                    }
                  />
                </FormControl>
              </Grid>
            )}
            <Grid xs={6} sm={4} item>
              <FormControl variant="filled" fullWidth>
                <FormControlLabel
                  control={<Checkbox name="excludeFinalDir" />}
                  label={
                    <>
                      <Trans>Exclude final directory</Trans>{' '}
                      <TooltipIcon>
                        <Trans>Skips adding a final directory to harvester for farming</Trans>
                      </TooltipIcon>
                    </>
                  }
                />
              </FormControl>
            </Grid>
            {op.haveBladebitDisableDirectDownloads && (
              <Grid xs={12} sm={4} item>
                <FormControl variant="filled" fullWidth>
                  <FormControlLabel
                    control={<Checkbox name="bladebitDisableDirectDownloads" />}
                    label={
                      <>
                        <Trans>Disable direct download</Trans>{' '}
                        <TooltipIcon>
                          <Trans>
                            Don't allocate host tables using pinned buffers, instead download to intermediate pinned
                            buffers then copy to the final host buffer.
                          </Trans>
                        </TooltipIcon>
                      </>
                    }
                  />
                </FormControl>
              </Grid>
            )}
            {op.haveBladebitDeviceIndex && (
              <Grid xs={12} sm={12} item>
                <FormControl variant="filled" fullWidth>
                  <TextField
                    name="bladebitDeviceIndex"
                    type="number"
                    variant="filled"
                    placeholder="default"
                    label={<Trans>GPU Device Index</Trans>}
                    helperText={<Trans>Which CUDA device to use when plotting</Trans>}
                  />
                </FormControl>
              </Grid>
            )}
          </Grid>
        </Grid>
      </AdvancedOptions>
    </CardStep>
  );
}

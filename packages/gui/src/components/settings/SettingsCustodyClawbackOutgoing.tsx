import { Flex, Form, TextField, ButtonLoading } from '@chia-network/core';
import { ConnectCheckmark } from '@chia-network/icons';
import {
  useClawbackDefaultTime,
  type ClawbackDefaultTimeInput,
  clawbackDefaultTimeDefaults,
} from '@chia-network/wallets';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';

const fields = [
  { name: 'days', label: 'Days', max: 365 },
  { name: 'hours', label: 'Hours', max: 24 },
  { name: 'minutes', label: 'Minutes', max: 60 },
];

export default function SettingsCustodyClawbackOutgoing(props) {
  const { clawbackDefaultTime, setClawbackDefaultTime, isClawbackDefaultTimeEnabled } = useClawbackDefaultTime();

  const methods = useForm<ClawbackDefaultTimeInput>({
    defaultValues: clawbackDefaultTime,
  });

  async function handleSubmit(valuesLocal: ClawbackDefaultTimeInput) {
    setClawbackDefaultTime(valuesLocal);
    // hook form does not reset isDirty after submit
    methods.reset({}, { keepValues: true });
  }

  return (
    <Box {...props}>
      <Form methods={methods} onSubmit={methods.handleSubmit(handleSubmit)}>
        <Flex gap={2}>
          {fields.map((field) => (
            <TextField
              name={field.name}
              key={field.name}
              label={field.label}
              type="number"
              size="small"
              InputProps={{
                inputProps: {
                  min: 0,
                  step: 1,
                  max: field.max,
                },
              }}
              data-testid={`SettingsCustodyClawbackOutgoing-${field.name}`}
              fullWidth
            />
          ))}

          <ButtonLoading
            size="small"
            type="submit"
            variant="contained"
            color="primary"
            disabled={!methods.formState.isDirty}
            data-testid="SettingsCustodyClawbackOutgoing-submit"
          >
            {isClawbackDefaultTimeEnabled ? <Trans>Save</Trans> : <Trans>Enable</Trans>}
          </ButtonLoading>
          {isClawbackDefaultTimeEnabled && (
            <ButtonLoading
              size="small"
              type="submit"
              variant="outlined"
              color="secondary"
              onClick={() => {
                methods.reset(clawbackDefaultTimeDefaults);
                setClawbackDefaultTime(clawbackDefaultTimeDefaults);
              }}
              data-testid="SettingsCustodyClawbackOutgoing-disable"
            >
              <Trans>Disable</Trans>
            </ButtonLoading>
          )}
        </Flex>
      </Form>
      {isClawbackDefaultTimeEnabled && (
        <Typography
          component="div"
          variant="subtitle2"
          sx={(theme) => ({ width: '100%', color: theme.palette.primary.dark, marginTop: 3 })}
        >
          <ConnectCheckmark
            sx={(theme) => ({
              verticalAlign: 'middle',
              position: 'relative',
              top: '-5px',
              left: '-7px',
              width: '31px',
              height: '31px',

              '& g': {
                circle: {
                  stroke: theme.palette.primary.main,
                  fill: theme.palette.primary.main,
                },
                path: {
                  stroke: theme.palette.primary.main,
                  fill: theme.palette.primary.main,
                },
              },
            })}
          />
          <Trans>Default claw back time is enabled.</Trans>{' '}
        </Typography>
      )}
      {!isClawbackDefaultTimeEnabled && (
        <Typography component="div" variant="subtitle2" sx={{ width: '100%', marginTop: 3 }}>
          <Trans>Default claw back time is disabled.</Trans>
        </Typography>
      )}
    </Box>
  );
}

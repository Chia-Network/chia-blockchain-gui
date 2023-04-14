import { Flex, Form, TextField, Button } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, Typography } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';

import useClawbackDefaultTime, {
  type ClawbackDefaultTimeInput,
  clawbackDefaultTimeDefaults,
} from '../../hooks/useClawbackDefaultTime';

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

          <Button
            size="small"
            type="submit"
            variant="contained"
            color="primary"
            disabled={!methods.formState.isDirty}
            data-testid="SettingsCustodyClawbackOutgoing-submit"
          >
            <Trans>{isClawbackDefaultTimeEnabled ? 'Save' : 'Enable'}</Trans>
          </Button>
          {isClawbackDefaultTimeEnabled && (
            <Button
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
            </Button>
          )}
        </Flex>
      </Form>
      {isClawbackDefaultTimeEnabled && (
        <Typography component="div" variant="subtitle2" sx={{ width: '100%', color: 'green', marginTop: 3 }}>
          <CheckCircleIcon sx={{ verticalAlign: 'middle', marginRight: 0.5, position: 'relative', top: '-2px' }} />
          <Trans>Default Clawback time is enabled. </Trans>{' '}
        </Typography>
      )}
      {!isClawbackDefaultTimeEnabled && (
        <Typography component="div" variant="subtitle2" sx={{ width: '100%', marginTop: 3 }}>
          <Trans>Default Clawback time is disabled. </Trans>
        </Typography>
      )}
    </Box>
  );
}

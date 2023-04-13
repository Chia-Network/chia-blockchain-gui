// import { usePrefs } from '@chia-network/api-react';
import { Flex, SettingsText, Form, TextField, ButtonLoading } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';

import useClawbackDefaultTime, { type ClawbackDefaultTime } from '../../hooks/useClawbackDefaultTime';

const fields = [
  { name: 'days', label: 'Days', max: 365 },
  { name: 'hours', label: 'Hours', max: 24 },
  { name: 'minutes', label: 'Minutes', max: 60 },
];
export default function SettingsCustodyClawbackOutgoing() {
  const { clawbackDefaultTime, setClawbackDefaultTime, isClawbackDefaultTimeEnabled } = useClawbackDefaultTime();

  const methods = useForm<ClawbackDefaultTime>({
    defaultValues: clawbackDefaultTime,
  });

  async function handleSubmit(values: ClawbackDefaultTime) {
    setClawbackDefaultTime(values);
  }

  return (
    <>
      <Form methods={methods} onSubmit={handleSubmit}>
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
            variant="outlined"
            color="secondary"
            data-testid="SettingsCustodyClawbackOutgoing-save"
          >
            <Trans>Save</Trans>
          </ButtonLoading>
        </Flex>
      </Form>
      {isClawbackDefaultTimeEnabled && (
        <Typography component="div" sx={{ width: '100%' }}>
          <span style={{ color: 'green' }}>
            <Trans>Default Clawback time is enabled. </Trans>
          </span>
          <br />
          <SettingsText>
            <Trans>Set all values to zero to disable it.</Trans>
          </SettingsText>
        </Typography>
      )}
    </>
  );
}

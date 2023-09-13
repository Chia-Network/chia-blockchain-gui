import { ButtonLoading, Flex, Form, SettingsLabel, TextField } from '@chia-network/core';
import { ConnectCheckmark } from '@chia-network/icons';
import { Trans, t } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';

import useOfferExpirationDefaultTime, {
  type OfferExpirationDefaultTimeInput,
  offerExpirationDefaultTimeDefaults,
} from '../../hooks/useOfferExpirationDefaultTime';

const fields = [
  { name: 'days', label: t`Days`, max: 365 },
  { name: 'hours', label: t`Hours`, max: 24 },
  { name: 'minutes', label: t`Minutes`, max: 60 },
];

export default function SettingsExpiringOffers(props) {
  const { offerExpirationDefaultTime, setOfferExpirationDefaultTime, isOfferExpirationDefaultTimeEnabled } =
    useOfferExpirationDefaultTime();

  const methods = useForm<OfferExpirationDefaultTimeInput>({
    defaultValues: offerExpirationDefaultTime,
  });

  async function handleSubmit(valuesLocal: OfferExpirationDefaultTimeInput) {
    const newValues = { ...valuesLocal, enabled: true };
    setOfferExpirationDefaultTime(newValues);
    methods.reset({}, { keepValues: true });
  }

  async function handleDisable() {
    const defaults = offerExpirationDefaultTimeDefaults;
    defaults.enabled = false;
    methods.reset(defaults);
    setOfferExpirationDefaultTime(defaults);
  }

  return (
    <Box sx={{ width: '100%', marginTop: 3 }} {...props}>
      <SettingsLabel>
        <Trans>Offer Expiration Time</Trans>
      </SettingsLabel>
      <Form methods={methods} onSubmit={methods.handleSubmit(handleSubmit)}>
        <Flex flexDirection="column" gap={1}>
          <Flex gap={2} sx={{ width: '100%', marginTop: 2 }}>
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
                disabled={!isOfferExpirationDefaultTimeEnabled}
                data-testid={`SettingsDefaultExpirationTime-${field.name}`}
                fullWidth
              />
            ))}
          </Flex>

          <ButtonLoading
            size="small"
            type="submit"
            variant="contained"
            color="primary"
            disabled={!methods.formState.isDirty && isOfferExpirationDefaultTimeEnabled}
            data-testid="SettingsDefaultExpirationTime-submit"
          >
            {isOfferExpirationDefaultTimeEnabled ? <Trans>Save</Trans> : <Trans>Enable</Trans>}
          </ButtonLoading>
          {isOfferExpirationDefaultTimeEnabled && (
            <ButtonLoading
              size="small"
              type="submit"
              variant="outlined"
              color="secondary"
              onClick={handleDisable}
              data-testid="SettingsOfferExpirationTime-disable"
            >
              <Trans>Disable</Trans>
            </ButtonLoading>
          )}
        </Flex>
      </Form>
      {isOfferExpirationDefaultTimeEnabled && (
        <Typography
          component="div"
          variant="subtitle2"
          sx={(theme) => ({ width: '100%', color: theme.palette.primary.main, marginTop: 2 })}
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
          <Trans>Default offer expiration time is enabled</Trans>{' '}
        </Typography>
      )}
      {!isOfferExpirationDefaultTimeEnabled && (
        <Typography component="div" variant="subtitle2" sx={{ width: '100%', marginTop: 2 }}>
          <Trans>Default offer expiration time is disabled</Trans>
        </Typography>
      )}
    </Box>
  );
}

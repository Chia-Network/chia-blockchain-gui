import { useGetAutoClaimQuery, useSetAutoClaimMutation } from '@chia-network/api-react';
import {
  Flex,
  SettingsText,
  Form,
  SettingsTitle,
  ButtonLoading,
  Fee,
  chiaToMojo,
  mojoToChia,
  useCurrencyCode,
} from '@chia-network/core';
import { ConnectCheckmark } from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';

export default function SettingsCustodyAutoClaim(props) {
  const [setAutoClaim, { isLoading: isSetAutoClaimLoading }] = useSetAutoClaimMutation();
  const { data: autoClaimData, isLoading } = useGetAutoClaimQuery();

  const currencyCode = useCurrencyCode();

  const methods = useForm({
    defaultValues: undefined,
  });

  async function handleSubmit({ fee }) {
    const feeInMojos = chiaToMojo(fee);
    await setAutoClaim({
      enabled: true,
      txFee: feeInMojos,
      minAmount: feeInMojos,
      batchSize: 50,
    }).unwrap();
  }

  async function disableAutoClaim() {
    await setAutoClaim({
      enabled: false,
      txFee: 0,
      minAmount: 0,
      batchSize: 50,
    }).unwrap();
  }

  if (isLoading) {
    return <Box>'Loading...'</Box>;
  }

  const isAutoClaimEnabled = autoClaimData?.enabled;
  const autoClaimFee = autoClaimData?.txFee ? mojoToChia(autoClaimData.txFee) : 0;

  return (
    <Box {...props}>
      <Form methods={methods} onSubmit={handleSubmit}>
        {isAutoClaimEnabled && (
          <Box>
            <Flex gap={3} flexDirection="column" alignItems="flex-start">
              <ButtonLoading
                size="small"
                loading={isSetAutoClaimLoading}
                variant="outlined"
                color="secondary"
                data-testid="SettingsCustodyAutoClaim-disable"
                onClick={() => disableAutoClaim()}
                sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
              >
                <Trans>Disable Auto claim</Trans>
              </ButtonLoading>

              <Typography component="div" variant="subtitle2" sx={(theme) => ({ color: theme.palette.primary.dark })}>
                <ConnectCheckmark
                  sx={(theme) => ({
                    verticalAlign: 'middle',
                    position: 'relative',
                    top: '-5px',
                    left: '-7px',
                    width: '31px',
                    height: '31px',

                    circle: {
                      stroke: theme.palette.primary.main,
                      fill: theme.palette.primary.main,
                    },
                    path: {
                      stroke: theme.palette.primary.main,
                      fill: theme.palette.primary.main,
                    },
                  })}
                />

                <Trans>Auto claim is enabled.</Trans>
              </Typography>
            </Flex>
            <Box sx={{ marginTop: 2 }}>
              <SettingsText>
                <Trans>
                  You will pay a fee {autoClaimFee} {currencyCode} when auto claiming Clawback transaction.
                </Trans>
              </SettingsText>
              <SettingsText>
                <Trans>Transactions less than the fee will not be auto claimed.</Trans>
              </SettingsText>
            </Box>
          </Box>
        )}
        {!isAutoClaimEnabled && (
          <>
            <SettingsTitle>
              <Trans>Please enter the transaction fee to enable auto claim:</Trans>
            </SettingsTitle>

            <Flex gap={2} sx={{ marginTop: 1, alignItems: 'top' }}>
              <Fee
                id="filled-secondary"
                variant="filled"
                name="fee"
                color="secondary"
                disabled={isSetAutoClaimLoading}
                label={<Trans>Fee</Trans>}
                data-testid="SettingsCustodyAutoClaim-fee"
                fullWidth
                sx={{ width: '300px' }}
              />

              <ButtonLoading
                size="small"
                type="submit"
                variant="outlined"
                color="secondary"
                loading={isSetAutoClaimLoading}
                data-testid="SettingsCustodyAutoClaim-save"
                sx={{ height: '55px' }}
              >
                <Trans>Save</Trans>
              </ButtonLoading>
            </Flex>
            <Typography component="div" variant="subtitle2" sx={{ marginTop: 3 }}>
              <Trans>Auto claim is disabled. </Trans>
            </Typography>
          </>
        )}
      </Form>
    </Box>
  );
}

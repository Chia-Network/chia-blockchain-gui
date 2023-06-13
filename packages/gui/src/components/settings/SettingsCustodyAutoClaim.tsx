import { useGetAutoClaimQuery, useSetAutoClaimMutation } from '@chia-network/api-react';
import { Flex, SettingsText, Form, ButtonLoading, Fee, chiaToMojo, mojoToChia } from '@chia-network/core';
import { ConnectCheckmark } from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';

export default function SettingsCustodyAutoClaim(props) {
  const [setAutoClaim, { isLoading: isSetAutoClaimLoading }] = useSetAutoClaimMutation();
  const { data: autoClaimData, isLoading } = useGetAutoClaimQuery();

  const isAutoClaimEnabled = autoClaimData?.enabled;
  const autoClaimFee = autoClaimData?.txFee ? mojoToChia(autoClaimData.txFee).toNumber() : 0;

  const methods = useForm({
    defaultValues: {
      fee: autoClaimFee,
    },
  });

  async function handleSubmit({ fee }: { fee: number }) {
    const feeInMojos = chiaToMojo(fee);
    await setAutoClaim({
      enabled: fee > 0,
      txFee: feeInMojos,
      minAmount: feeInMojos,
      batchSize: 50,
    }).unwrap();

    // hook form does not reset isDirty after submit
    methods.reset({}, { keepValues: true });
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

  return (
    <Box {...props}>
      <Form methods={methods} onSubmit={handleSubmit}>
        <>
          <Flex gap={2} sx={{ marginTop: 1, alignItems: 'flex-start' }}>
            <Fee
              id="filled-secondary"
              variant="filled"
              name="fee"
              color="secondary"
              disabled={isSetAutoClaimLoading}
              label={<Trans>Transaction auto claim fee</Trans>}
              data-testid="SettingsCustodyAutoClaim-fee"
              fullWidth
              sx={{ width: '300px' }}
            />

            <ButtonLoading
              size="small"
              type="submit"
              variant="contained"
              color="primary"
              loading={isSetAutoClaimLoading}
              disabled={!methods.formState.isDirty}
              data-testid="SettingsCustodyAutoClaim-save"
              sx={{ height: '55px' }}
            >
              {isAutoClaimEnabled ? <Trans>Save</Trans> : <Trans>Enable</Trans>}
            </ButtonLoading>

            {isAutoClaimEnabled && (
              <ButtonLoading
                size="small"
                loading={isSetAutoClaimLoading}
                variant="outlined"
                color="secondary"
                data-testid="SettingsCustodyAutoClaim-disable"
                onClick={async () => {
                  await disableAutoClaim();
                  methods.reset({ fee: 0 });
                }}
                sx={{ height: '55px' }}
              >
                <Trans>Disable</Trans>
              </ButtonLoading>
            )}
          </Flex>
          <Box sx={{ marginTop: 3 }} />
          {isAutoClaimEnabled && (
            <>
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

              <Box sx={{ marginTop: 2 }}>
                <SettingsText>
                  <Trans>Your wallet is required to be running for auto claim to work. </Trans>
                </SettingsText>
                <SettingsText>
                  <Trans>Transactions less than the fee will not be auto claimed.</Trans>
                </SettingsText>
              </Box>
            </>
          )}
          {!isAutoClaimEnabled && (
            <Typography component="div" variant="subtitle2" sx={{ marginTop: 3 }}>
              <Trans>Auto claim is disabled. </Trans>
            </Typography>
          )}
        </>
      </Form>
    </Box>
  );
}

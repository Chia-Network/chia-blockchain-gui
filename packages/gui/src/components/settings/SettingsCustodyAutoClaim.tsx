import {
  Flex,
  SettingsText,
  Form,
  SettingsTitle,
  ButtonLoading,
  EstimatedFee,
  FeeTxType,
  useCurrencyCode,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function SettingsCustodyClawbackOutgoing(props) {
  const [fee, setFee] = useState(null);

  const currencyCode = useCurrencyCode();

  const methods = useForm({
    defaultValues: undefined,
  });

  async function handleSubmit(values) {
    setFee(values.fee);
  }

  return (
    <Box {...props}>
      <Form methods={methods} onSubmit={handleSubmit}>
        {fee && (
          <div>
            <Flex gap={2} sx={{ alignItems: 'center' }}>
              <Typography component="div" variant="subtitle2">
                <span style={{ color: 'green' }}>
                  <CheckCircleIcon
                    sx={{ verticalAlign: 'middle', marginRight: 0.5, position: 'relative', top: '-2px' }}
                  />

                  <Trans>Auto claim is enabled.</Trans>
                </span>
              </Typography>
              <ButtonLoading
                size="small"
                // type="submit"
                variant="outlined"
                color="secondary"
                // data-testid="SettingsCustodyClawbackOutgoing-save"
                onClick={() => setFee(null)}
                sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
              >
                <Trans>Disable Auto claim</Trans>
              </ButtonLoading>
            </Flex>
            <Box sx={{ marginTop: 2 }}>
              <SettingsText>
                <Trans>
                  You will pay a fee {fee} {currencyCode} when auto claiming Clawback transaction.
                </Trans>{' '}
                <br />
                <Trans>Transactions with values smaller than the fee will not be auto claimed.</Trans>
              </SettingsText>
            </Box>
          </div>
        )}
        {!fee && (
          <>
            <SettingsTitle>
              <Trans>Please select the transaction fee to enable Auto claim:</Trans>
            </SettingsTitle>

            <Flex gap={2} sx={{ marginTop: 1, alignItems: 'top' }}>
              <EstimatedFee
                id="filled-secondary"
                variant="filled"
                name="fee"
                color="secondary"
                // disabled={isSubmitting}
                label={<Trans>Fee</Trans>}
                // data-testid="WalletSend-fee"
                fullWidth
                sx={{ width: '380px' }}
                txType={FeeTxType.walletSendXCH}
              />

              <ButtonLoading
                size="small"
                type="submit"
                variant="outlined"
                color="secondary"
                data-testid="SettingsCustodyClawbackOutgoing-save"
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

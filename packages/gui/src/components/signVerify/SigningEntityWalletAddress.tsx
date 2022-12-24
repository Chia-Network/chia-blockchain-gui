import { useGetCurrentAddressQuery } from '@chia-network/api-react';
import { CopyToClipboard, Flex, Loading, TextField } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Grid, InputAdornment } from '@mui/material';
import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { SignMessageEntityType, SignMessageWalletAddressEntity } from './SignMessageEntities';

export type SigningEntityWalletAddressProps = {
  entityName: string;
  entityValueName: string;
};

export default function SigningEntityWalletAddress(props: SigningEntityWalletAddressProps) {
  const { entityName, entityValueName } = props;
  const { getValues, setValue } = useFormContext();

  const { data: currentAddress, isLoading: isLoadingCurrentAddress } = useGetCurrentAddressQuery({ walletId: 1 });

  useEffect(() => {
    if (entityName && currentAddress) {
      const currentValue = getValues(entityName);

      // Set the current address if a value isn't already set
      if (!currentValue) {
        const entity: SignMessageWalletAddressEntity = {
          type: SignMessageEntityType.WalletAddress,
          address: currentAddress,
        };
        setValue(entityName, entity);
      }
    }
  }, [entityName, currentAddress, setValue, getValues]);

  return (
    <Flex flexDirection="column" gap={1}>
      <Grid item xs={12}>
        <Box display="flex">
          <Box flexGrow={1}>
            {isLoadingCurrentAddress ? (
              <Loading center />
            ) : (
              <TextField
                label={<Trans>Address</Trans>}
                variant="filled"
                name={entityValueName}
                inputProps={{
                  'data-testid': 'SigningEntityWalletAddress-address',
                  readOnly: false,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CopyToClipboard value={currentAddress} data-testid="SigningEntityWalletAddress-address-copy" />
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />
            )}
          </Box>
        </Box>
      </Grid>
    </Flex>
  );
}

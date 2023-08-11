import { CopyToClipboard, Flex, TextField } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Grid, InputAdornment } from '@mui/material';
import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { SignMessageEntityType, SignMessageVCEntity } from './SignMessageEntities';

export type SigningEntityVCProps = {
  entityName: string;
  entityValueName: string;
};

export default function SigningEntityVC(props: SigningEntityVCProps) {
  const { entityName, entityValueName } = props;
  const { getValues, setValue } = useFormContext();

  useEffect(() => {
    if (entityName && entityValueName) {
      const currentValue = getValues(entityValueName);

      if (currentValue === undefined) {
        const entity: SignMessageVCEntity = {
          type: SignMessageEntityType.VC,
          vcId: '',
          address: '',
        };
        setValue(entityName, entity);
      }
    }
  }, [entityName, entityValueName, setValue, getValues]);

  return (
    <Flex flexDirection="column" gap={1}>
      <Grid item xs={12}>
        <Box display="flex">
          <Box flexGrow={1}>
            <TextField
              label={<Trans>Credential Id</Trans>}
              variant="filled"
              name={entityValueName}
              inputProps={{
                'data-testid': 'SigningEntityVC-launcherId',
                readOnly: false,
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <CopyToClipboard value="" data-testid="SigningEntityVC-launcherId-copy" />
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
          </Box>
        </Box>
      </Grid>
    </Flex>
  );
}

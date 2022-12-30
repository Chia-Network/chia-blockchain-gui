import { Card, Flex } from '@chia-network/core';
import { Box, Grid } from '@mui/material';
import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import DIDProfileDropdown from '../did/DIDProfileDropdown';
import { SignMessageEntityType, SignMessageDIDEntity } from './SignMessageEntities';

export type SigningEntityDIDProps = {
  entityName: string;
  entityValueName: string;
};

export default function SigningEntityDID(props: SigningEntityDIDProps) {
  const { entityName, entityValueName } = props;
  const { getValues, setValue } = useFormContext();

  useEffect(() => {
    if (entityName) {
      const currentValue = getValues(entityName);

      // Set the current address if a value isn't already set
      if (!currentValue) {
        const entity: SignMessageDIDEntity = {
          type: SignMessageEntityType.DID,
          didId: '',
        };
        setValue(entityName, entity);
      }
    }
  }, [entityName, setValue, getValues]);

  return (
    <Flex flexDirection="column" gap={1}>
      <Card>
        <Grid item xs={12}>
          <Box display="flex">
            <Box flexGrow={1}>
              <DIDProfileDropdown />
            </Box>
          </Box>
        </Grid>
      </Card>
    </Flex>
  );
}

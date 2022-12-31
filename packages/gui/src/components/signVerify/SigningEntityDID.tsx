import type { Wallet } from '@chia-network/api';
import { useGetDIDsQuery } from '@chia-network/api-react';
import { CopyToClipboard, Flex, TextField } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Grid, InputAdornment } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import DIDProfileDropdown from '../did/DIDProfileDropdown';
import { SignMessageEntityType, SignMessageDIDEntity } from './SignMessageEntities';

export type SigningEntityDIDProps = {
  entityName: string;
  entityValueName: string;
};

export default function SigningEntityDID(props: SigningEntityDIDProps) {
  const { entityName, entityValueName } = props;
  const [walletId, setWalletId] = useState<number | undefined>(undefined);
  const { getValues, setValue } = useFormContext();

  const { data: allDIDWallets, isLoading: isLoadingDIDs } = useGetDIDsQuery();
  const isLoading = isLoadingDIDs;

  function handleProfileSelected(newWalletId?: number) {
    const did = allDIDWallets?.find((wallet: Wallet) => wallet.id === newWalletId)?.myDid;
    setWalletId(newWalletId);
    setValue(entityValueName, did);
  }

  useEffect(() => {
    if (entityName && entityValueName && allDIDWallets?.length > 0) {
      const currentValue = getValues(entityValueName);
      const firstDID = allDIDWallets[0].myDid;

      // Set the first DID if a value isn't already set
      if (currentValue === undefined && firstDID) {
        const entity: SignMessageDIDEntity = {
          type: SignMessageEntityType.DID,
          didId: firstDID,
        };
        setWalletId(allDIDWallets[0].id);
        setValue(entityName, entity);
      }
    }
  }, [entityName, entityValueName, allDIDWallets, setValue, getValues]);

  return (
    <Flex flexDirection="column" gap={1}>
      <Grid item xs={12}>
        <Box display="flex">
          <Box flexGrow={1}>
            <Flex flexDirection="column" gap={1}>
              <DIDProfileDropdown
                walletId={walletId}
                onChange={handleProfileSelected}
                defaultTitle={<Trans>Select Profile</Trans>}
                variant="outlined"
                color="primary"
                disabled={isLoading}
              />
              <TextField
                label={<Trans>DID</Trans>}
                variant="filled"
                name={entityValueName}
                inputProps={{
                  'data-testid': 'SigningEntityDID-did',
                  readOnly: true,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CopyToClipboard value="currentAddress" data-testid="SigningEntityDID-did-copy" />
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />
            </Flex>
          </Box>
        </Box>
      </Grid>
    </Flex>
  );
}

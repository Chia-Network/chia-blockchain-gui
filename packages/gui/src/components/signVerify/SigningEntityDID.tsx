import type { Wallet } from '@chia-network/api';
import { useGetDIDInfoQuery, useGetDIDsQuery } from '@chia-network/api-react';
import { CopyToClipboard, Flex, TextField } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { InputAdornment } from '@mui/material';
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
  const currentValue = getValues(entityName);
  const { data: didInfo } = useGetDIDInfoQuery({ coinOrDIDId: currentValue?.didId }, { skip: !currentValue?.didId });

  const isLoading = isLoadingDIDs;

  function handleProfileSelected(newWalletId?: number) {
    const did = allDIDWallets?.find((wallet: Wallet) => wallet.id === newWalletId)?.myDid;
    setWalletId(newWalletId);
    setValue(entityValueName, did);
  }

  useEffect(() => {
    if (entityName && entityValueName && allDIDWallets?.length > 0) {
      const localCurrentValue = getValues(entityValueName);
      const firstDID = allDIDWallets[0].myDid;

      // Set the first DID if a value isn't already set
      if (localCurrentValue === undefined && firstDID) {
        const entity: SignMessageDIDEntity = {
          type: SignMessageEntityType.DID,
          didId: firstDID,
          address: '',
        };
        setWalletId(allDIDWallets[0].id);
        setValue(entityName, entity);
      }
    }
  }, [entityName, entityValueName, allDIDWallets, setValue, getValues]);

  useEffect(() => {
    const localCurrentValue = getValues(entityValueName);

    if (localCurrentValue && didInfo?.p2Address) {
      const entity: SignMessageDIDEntity = {
        type: SignMessageEntityType.DID,
        didId: localCurrentValue,
        address: didInfo.p2Address,
      };
      setValue(entityName, entity);
    }
  }, [entityName, entityValueName, didInfo, setValue, getValues]);

  return (
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
        disabled
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <CopyToClipboard value={currentValue?.didId ?? ''} data-testid="SigningEntityDID-did-copy" />
            </InputAdornment>
          ),
        }}
        fullWidth
      />
    </Flex>
  );
}

import { CopyToClipboard, Flex, TextField } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { InputAdornment } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import VCDropdown from '../vcs/VCDropdown';
import { SignMessageEntityType, SignMessageVCEntity } from './SignMessageEntities';

export type SigningEntityVCProps = {
  entityName: string;
  entityValueName: string;
};

export default function SigningEntityVC(props: SigningEntityVCProps) {
  const { entityName, entityValueName } = props;
  const { getValues, setValue } = useFormContext();
  const [vcLauncherId, setVCLauncherId] = useState<string | undefined>(getValues(entityValueName));

  function handleVCSelected(newVCLauncherId?: string) {
    setVCLauncherId(newVCLauncherId);
    setValue(entityValueName, newVCLauncherId);
  }

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
      <VCDropdown
        vcLauncherId={vcLauncherId}
        onChange={handleVCSelected}
        defaultTitle={<Trans>Select a Credential</Trans>}
        variant="outlined"
        color="primary"
        // disabled={isLoading}
        fullWidth
      />
      <TextField
        label={<Trans>Credential Id</Trans>}
        variant="filled"
        name={entityValueName}
        inputProps={{
          'data-testid': 'signing-entity-vc-launcher-id',
          readOnly: true,
        }}
        disabled
        InputLabelProps={{
          shrink: !!vcLauncherId,
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <CopyToClipboard value={vcLauncherId ?? ''} data-testid="signing-entity-vc-launcher-id-copy" />
            </InputAdornment>
          ),
        }}
        fullWidth
      />
    </Flex>
  );
}

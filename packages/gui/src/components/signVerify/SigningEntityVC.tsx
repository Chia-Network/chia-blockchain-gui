import { useLocalStorage } from '@chia-network/api-react';
import { CopyToClipboard, DropdownActions, Flex, MenuItem, TextField } from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import { Checkbox, InputAdornment, Typography } from '@mui/material';
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
  const [proofs] = useLocalStorage<string[]>('proofs', []);
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
    <Flex flexDirection="column" gap={2}>
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
      <Flex flexDirection="row" alignItems="center" flexGrow={1} gap={1}>
        <Typography color="textPrimary">
          <Trans>Include Proofs:</Trans>
        </Typography>
        <Flex flexDirection="column" flexGrow={1} gap={1}>
          <DropdownActions
            onSelect={() => {}}
            label={t`Select Proofs`}
            variant="outlined"
            color="secondary"
            // size="large"
            fullWidth
          >
            {(proofs ?? []).map((proof) => (
              <MenuItem onClick={() => {}} value={proof} selected={false} title={proof}>
                <Checkbox
                  disableRipple
                  disableFocusRipple
                  disableTouchRipple
                  onChange={() => {}}
                  sx={{ '&:hover': { background: 'none' }, backgroundColor: 'none' }}
                />
                {proof}
              </MenuItem>
            ))}
          </DropdownActions>
        </Flex>
      </Flex>
    </Flex>
  );
}

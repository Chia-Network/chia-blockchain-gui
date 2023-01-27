import { CopyToClipboard, Flex, TextField } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Grid, InputAdornment } from '@mui/material';
import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { launcherIdFromNFTId } from '../../util/nfts';
import NFTSummary from '../nfts/NFTSummary';
import { SignMessageEntityType, SignMessageNFTEntity } from './SignMessageEntities';

export type SigningEntityNFTProps = {
  entityName: string;
  entityValueName: string;
};

export default function SigningEntityNFT(props: SigningEntityNFTProps) {
  const { entityName, entityValueName } = props;
  const { getValues, setValue } = useFormContext();
  const currentValue = getValues(entityName);
  const nftId = currentValue?.nftId;
  let launcherId: string | undefined;

  useEffect(() => {
    if (entityName && entityValueName) {
      const localCurrentValue = getValues(entityValueName);

      if (localCurrentValue === undefined) {
        const entity: SignMessageNFTEntity = {
          type: SignMessageEntityType.NFT,
          nftId: '',
        };
        setValue(entityName, entity);
      }
    }
  }, [entityName, entityValueName, setValue, getValues]);

  if (nftId) {
    try {
      launcherId = launcherIdFromNFTId(nftId);
    } catch (e) {
      // do nothing
    }
  }

  return (
    <Flex flexDirection="column" gap={1}>
      <Grid item xs={12}>
        <Box display="flex">
          <Box flexGrow={1}>
            <Flex flexDirection="column" gap={1}>
              <TextField
                label={<Trans>NFT ID</Trans>}
                variant="filled"
                name={entityValueName}
                inputProps={{
                  'data-testid': 'SigningEntityNFT-nftId',
                  readOnly: false,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CopyToClipboard value="" data-testid="SigningEntityNFT-nftId-copy" />
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />
              {launcherId && <NFTSummary launcherId={launcherId} />}
            </Flex>
          </Box>
        </Box>
      </Grid>
    </Flex>
  );
}

import { toBech32m } from '@chia-network/api';
import { useGetNFTInfoQuery } from '@chia-network/api-react';
import { CopyToClipboard, Flex, TextField, useCurrencyCode } from '@chia-network/core';
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
  const currencyCode = useCurrencyCode();
  const currentValue = getValues(entityName);
  const nftId = currentValue?.nftId;
  const launcherId = nftId ? launcherIdFromNFTId(nftId) : undefined;
  const { data: nftInfo } = useGetNFTInfoQuery({ coinId: launcherId }, { skip: !launcherId });

  useEffect(() => {
    if (entityName && entityValueName) {
      const localCurrentValue = getValues(entityValueName);

      if (localCurrentValue === undefined) {
        const entity: SignMessageNFTEntity = {
          type: SignMessageEntityType.NFT,
          nftId: '',
          address: '',
        };
        setValue(entityName, entity);
      }
    }
  }, [entityName, entityValueName, setValue, getValues]);

  useEffect(() => {
    const localCurrentValue = getValues(entityValueName);

    if (localCurrentValue && nftInfo?.p2Address && currencyCode) {
      const p2Address = toBech32m(nftInfo.p2Address, currencyCode);
      const entity: SignMessageNFTEntity = {
        type: SignMessageEntityType.NFT,
        nftId: localCurrentValue,
        address: p2Address,
      };
      setValue(entityName, entity);
    }
  }, [entityName, entityValueName, setValue, getValues, nftInfo, currencyCode]);

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

import { toBech32m } from '@chia-network/api';
import { CopyToClipboard, Flex, useCurrencyCode } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { InputAdornment } from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import useNFT from '../../hooks/useNFT';
import { launcherIdFromNFTId } from '../../util/nfts';
import NFTAutocomplete from '../nfts/NFTAutocomplete';
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

  const entityFormName = `${entityName}.nftId`;
  const searchValue = useWatch({
    name: entityFormName,
  });
  const launcherId = useMemo(() => searchValue && launcherIdFromNFTId(searchValue), [searchValue]);

  const { nft } = useNFT(searchValue);

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

    if (localCurrentValue && nft?.p2Address && currencyCode) {
      const p2Address = toBech32m(nft.p2Address, currencyCode);
      const entity: SignMessageNFTEntity = {
        type: SignMessageEntityType.NFT,
        nftId: localCurrentValue,
        address: p2Address,
      };
      setValue(entityName, entity);
    }
  }, [entityName, entityValueName, setValue, getValues, nft, currencyCode]);

  return (
    <Flex flexDirection="column" gap={2}>
      <NFTAutocomplete
        label={<Trans>NFT ID</Trans>}
        variant="filled"
        name={entityFormName}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <CopyToClipboard value={searchValue} data-testid="SigningEntityNFT-nftId-copy" />
            </InputAdornment>
          ),
        }}
        fullWidth
      />
      {launcherId && <NFTSummary launcherId={launcherId} />}
    </Flex>
  );
}

import { type NFTInfo } from '@chia-network/api';
import { Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Autocomplete, Box, Typography, TextField, TextFieldProps } from '@mui/material';
import { get } from 'lodash';
import React, { useState, type ReactNode, useMemo, useCallback } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import useHideObjectionableContent from '../../hooks/useHideObjectionableContent';
import useNFTs from '../../hooks/useNFTs';
import getNFTId from '../../util/getNFTId';
import NFTMetadata from './NFTMetadata';
import NFTPreview from './NFTPreview';
import NFTTitle from './NFTTitle';

export type NFTAutocompleteProps = {
  name: string;
  defaultValue?: string;
  label?: ReactNode;
  variant?: 'standard' | 'outlined' | 'filled';
  rules?: any;
  color?: TextFieldProps['color'];
  required?: boolean;
  fullWidth?: boolean;
  InputProps?: TextFieldProps['InputProps'];
};

export default function NFTAutocomplete(props: NFTAutocompleteProps) {
  const { name, defaultValue, label, rules, variant, color, required, fullWidth, InputProps = {} } = props;
  const [inputValue, setInputValue] = useState('');

  const [searchText, setSearchText] = useState('');
  const [hideObjectionableContent] = useHideObjectionableContent();
  const { nfts, isLoading } = useNFTs({
    hideSensitiveContent: hideObjectionableContent,
    search: searchText,
  });

  const { control, errors } = useFormContext();
  const {
    field: { onChange, onBlur, value, ref },
  } = useController({
    name,
    control,
    defaultValue,
    rules,
  });

  const errorMessage = get(errors, name);

  const renderOption = useCallback(
    (renderProps, nft) => {
      if (!nft) {
        return (
          <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...renderProps}>
            <Trans>Select an NFT</Trans>
          </Box>
        );
      }

      return (
        <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...renderProps}>
          <Flex gap={2} alignItems="center" minWidth={0}>
            <NFTPreview width="50px" id={nft.launcherId} fit="cover" isCompact preview />
            <Flex flexDirection="column" minWidth={0}>
              <NFTTitle nftId={nft.launcherId} highlight={inputValue} />
              <Typography color="textSecondary" variant="body2">
                <NFTMetadata nftId={nft.launcherId} path="collection.name" highlight={inputValue} />
              </Typography>
            </Flex>
          </Flex>
        </Box>
      );
    },
    [inputValue]
  );

  const handleChange = useCallback(
    (_event: any, newValue: NFTInfo | undefined) => {
      if (!newValue) {
        onChange('');
        return;
      }

      if (newValue?.launcherId) {
        onChange(getNFTId(newValue.launcherId));
      }
    },
    [onChange]
  );

  const handleInputValueChange = useCallback(
    (_event: any, newInputValue: string) => {
      setInputValue(newInputValue);
      setSearchText(newInputValue);
      onChange(newInputValue || '');
    },
    [onChange]
  );

  const handleClose = useCallback(() => {
    setSearchText('');
  }, []);

  const firstOption = useMemo(() => nfts[0], [nfts]);

  const selectedNFT = useMemo(() => {
    if (!value) {
      return undefined;
    }

    return nfts.find((nft) => getNFTId(nft.launcherId) === value);
  }, [nfts, value]);

  const isOptionEqualToValue = useCallback(
    (option) => {
      if (!selectedNFT && option === firstOption) {
        return true;
      }

      if (!selectedNFT) {
        return false;
      }

      return option.launcherId === selectedNFT.launcherId;
    },
    [firstOption, selectedNFT]
  );

  return (
    <Autocomplete
      renderOption={renderOption}
      options={nfts}
      value={value}
      onChange={handleChange}
      onClose={handleClose}
      filterOptions={(options) => options} // disable filtering we are using our own
      loading={isLoading}
      inputValue={inputValue}
      onInputChange={handleInputValueChange}
      isOptionEqualToValue={isOptionEqualToValue}
      renderInput={(params) => (
        <TextField
          {...params}
          autoComplete="off"
          error={errorMessage}
          onBlur={onBlur}
          inputRef={ref}
          label={label}
          variant={variant}
          color={color}
          required={required}
          fullWidth={fullWidth}
          InputProps={{
            ...InputProps,
            ...params.InputProps,
            type: 'new-password',
          }}
        />
      )}
      getOptionLabel={(option) => {
        if (!option) {
          return '';
        }

        if (typeof option === 'string') {
          return option;
        }

        return getNFTId(option.launcherId);
      }}
    />
  );
}

import { type NFTInfo } from '@chia-network/api';
import { Flex } from '@chia-network/core';
import { Autocomplete, Box, Typography, TextField, TextFieldProps } from '@mui/material';
import { get } from 'lodash';
import React, { useState, type ReactNode } from 'react';
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
};

export default function NFTAutocomplete(props: NFTAutocompleteProps) {
  const { name, defaultValue, label, rules, variant, color, required, fullWidth } = props;
  const [inputValue, setInputValue] = useState('');

  const [hideObjectionableContent] = useHideObjectionableContent();
  const { nfts, isLoading } = useNFTs({
    hideSensitiveContent: hideObjectionableContent,
    search: inputValue,
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

  function renderOption(renderProps, nft) {
    return (
      <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...renderProps}>
        <Flex gap={2} alignItems="center" minWidth={0}>
          <NFTPreview width="50px" id={nft.launcherId} fit="cover" isCompact preview />
          <Flex flexDirection="column" minWidth={0}>
            <NFTTitle nftId={nft.launcherId} highlight={inputValue} />
            <Typography color="textSecondary" variant="body2">
              <NFTMetadata nftId={nft.launcherId} path="collection?.name" highlight={inputValue} />
            </Typography>
          </Flex>
        </Flex>
      </Box>
    );
  }

  function handleChange(_event: any, newValue: NFTInfo | undefined) {
    if (newValue?.launcherId) {
      onChange(getNFTId(newValue.launcherId));
    }
  }

  function handleInputValueChange(_event: any, newInputValue: string) {
    setInputValue(newInputValue);
    onChange(newInputValue || '');
  }

  return (
    <Autocomplete
      // freeSolo
      renderOption={renderOption}
      options={nfts}
      value={value}
      onChange={handleChange}
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
      inputValue={inputValue}
      onInputChange={handleInputValueChange}
      loading={isLoading}
    />
  );
}

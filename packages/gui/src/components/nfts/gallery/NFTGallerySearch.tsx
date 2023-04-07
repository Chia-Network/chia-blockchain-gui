import { Flex } from '@chia-network/core';
import { Search as SearchIcon } from '@mui/icons-material';
import { InputBase, InputBaseProps } from '@mui/material';
import React from 'react';

export type SearchProps = InputBaseProps & {
  onUpdate: (value: string) => void;
  placeholder?: string;
};

export default function Search(props: SearchProps) {
  const { onUpdate, placeholder, ...rest } = props;

  return (
    <Flex
      gap={1}
      alignItems="center"
      sx={{
        borderColor: 'action.focus',
        backgroundColor: 'background.paper',
        paddingX: 1,
        borderRadius: 1,
        borderWidth: 1,
        borderStyle: 'solid',
      }}
    >
      <SearchIcon sx={{ color: 'text.secondary' }} />
      <InputBase
        onInput={(event) => onUpdate((event.target as HTMLInputElement).value)}
        placeholder={placeholder}
        {...rest}
      />
    </Flex>
  );
}

import { Color, Flex } from '@chia-network/core';
import { Search as SearchIcon } from '@mui/icons-material';
import { InputBase, InputBaseProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

export type SearchProps = InputBaseProps & {
  onUpdate: (value: string) => void;
  placeholder?: string;
};

export default function Search(props: SearchProps) {
  const { onUpdate, placeholder, ...rest } = props;
  const theme: any = useTheme();

  return (
    <Flex
      gap={1}
      alignItems="center"
      sx={{
        borderColor: theme.palette.mode === 'dark' ? Color.Neutral[700] : Color.Neutral[300],
        backgroundColor: 'background.paper',
        paddingX: 1,
        borderRadius: 1,
        borderWidth: 1,
        borderStyle: 'solid',
      }}
    >
      <SearchIcon sx={{ color: theme.palette.mode === 'dark' ? Color.Neutral[400] : Color.Neutral[500] }} />
      <InputBase
        onInput={(event) => onUpdate((event.target as HTMLInputElement).value)}
        placeholder={placeholder}
        {...rest}
      />
    </Flex>
  );
}

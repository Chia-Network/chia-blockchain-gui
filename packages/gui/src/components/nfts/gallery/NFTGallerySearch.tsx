import { useDarkMode } from '@chia-network/core';
import { InputBase, InputBaseProps } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import CheckIcon from '../../../assets/img/search.svg';

const SearchBase = styled('div')<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: isDarkMode ? '#333' : '#fff',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
  width: '350px',
  border: `1px solid ${isDarkMode ? '#333' : '#E0E0E0'}`,
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 0),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(2)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    lineHeight: '50px',
    position: 'relative',
    top: '4px',
  },
}));

const SearchIcon = styled(CheckIcon)``;

export type SearchProps = InputBaseProps & {
  onUpdate: (value: string) => void;
  placeholder?: string;
};

export default function Search(props: SearchProps) {
  const { onUpdate, placeholder, ...rest } = props;
  const { isDarkMode } = useDarkMode();

  return (
    <SearchBase isDarkMode={isDarkMode}>
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>
      <StyledInputBase
        onInput={(event) => onUpdate((event.target as HTMLInputElement).value)}
        placeholder={placeholder}
        {...rest}
      />
    </SearchBase>
  );
}

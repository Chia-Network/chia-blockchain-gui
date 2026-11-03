import { WalletType } from '@chia-network/api';
import { Button, Spinner, Flex, Tooltip, useTrans, ScrollbarFlex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Add, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import { alpha, Box, IconButton, InputBase, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useToggle } from 'react-use';
import styled from 'styled-components';

import useWalletsList from '../hooks/useWalletsList';

import WalletTokenCard from './WalletTokenCard';

// The Chia theme draws the panel as a sheet: the card surface with hairline edges, raised only while open, and a
// standard field for search. Other themes keep the tinted panel.
function isSheet(theme: any): boolean {
  return theme.chiaTheme?.variant === 'chia';
}

const Search = styled('div')(({ theme }) =>
  isSheet(theme)
    ? {
        position: 'relative',
        borderRadius: 6,
        backgroundColor: theme.palette.surfaces?.field ?? theme.palette.background.paper,
        border: `1px solid ${theme.palette.border.dark}`,
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
        '& svg': { color: theme.palette.text.secondary },
      }
    : {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.08),
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.12),
        },
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
      },
);

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
  },
}));

// drop-shadow follows the painted sheet, not the full-height overlay box, so the empty area above casts nothing.
const SHEET_SHADOW = {
  light: 'drop-shadow(0 -4px 16px rgba(18, 41, 87, 0.1)) drop-shadow(0 -1px 2px rgba(18, 41, 87, 0.05))',
  dark: 'drop-shadow(0 -4px 12px rgba(0, 0, 0, 0.35))',
};

const StyledRoot = styled(Box)`
  filter: ${({ theme, $expanded }) => (isSheet(theme) && $expanded ? SHEET_SHADOW[theme.palette.mode] : 'none')};
  position: absolute;
  bottom: 0;
  left: ${({ theme }) => theme.spacing(1)};
  right: ${({ theme }) => theme.spacing(2)};
  top: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  z-index: 1;
  pointer-events: none;
`;

const StyledButtonContainer = styled(Box)`
  background-color: ${({ theme }) => theme.palette.background.default};
`;

function panelBorder(theme: { palette: { mode: string; primary: { main: string } } }) {
  return alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.18);
}

const StyledMainButton = styled(Button)`
  border-radius: ${({ theme }) => (isSheet(theme) ? '8px 8px 0 0' : `${theme.spacing(2)} ${theme.spacing(2)} 0 0`)};
  border: ${({ theme }) => `1px solid ${isSheet(theme) ? theme.palette.divider : panelBorder(theme)}`};
  border-bottom-color: ${({ theme }) => (isSheet(theme) ? 'transparent' : panelBorder(theme))};
  background-color: ${({ theme }) =>
    isSheet(theme)
      ? theme.palette.background.card
      : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)};
  color: ${({ theme }) => theme.palette.text.primary};
  height: ${({ theme }) => theme.spacing(6)};
  pointer-events: auto;

  &:hover {
    background-color: ${({ theme }) =>
      isSheet(theme)
        ? theme.palette.action.hover
        : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.16)};
  }
`;

const StyledBody = styled(({ expanded, ...rest }) => <Box {...rest} />)`
  pointer-events: auto;
  background-color: ${({ theme }) =>
    isSheet(theme)
      ? theme.palette.background.card
      : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)};
  transition: all 0.25s ease-out;
  overflow: hidden;
  height: ${({ expanded }) => (expanded ? '100%' : '0%')};
`;

const StyledContent = styled(Box)`
  height: 100%;
  background-color: ${({ theme }) => {
    if (isSheet(theme)) {
      return theme.palette.background.card;
    }
    return theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.96)
      : alpha(theme.palette.background.paper, 0.98);
  }};
  padding-top: ${({ theme }) => theme.spacing(2)};
  border-top: ${({ theme }) => (isSheet(theme) ? `1px solid ${theme.palette.divider}` : 'none')};
  border-left: 1px solid ${({ theme }) => (isSheet(theme) ? theme.palette.divider : panelBorder(theme))};
  border-right: 1px solid ${({ theme }) => (isSheet(theme) ? theme.palette.divider : panelBorder(theme))};
  display: flex;
  flex-direction: column;
`;

const StyledListBody = styled(ScrollbarFlex)`
  overflow-y: hidden;
  flex-direction: column;
  flex-grow: 1;
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const StyledExpandButtonContainer = styled(Box)`
  position: absolute;
  right: ${({ theme }) => theme.spacing(-4)};
  top: ${({ theme }) => theme.spacing(0)};
`;

export default function WalletsManageTokens() {
  const [expanded, toggle] = useToggle(false);
  const sheet = isSheet(useTheme());
  const t = useTrans();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { list, hide, show, isLoading } = useWalletsList(search, [
    WalletType.STANDARD_WALLET,
    WalletType.CAT,
    WalletType.RCAT,
    WalletType.CRCAT,
  ]);

  function handleAddToken(event) {
    event.preventDefault();
    event.stopPropagation();

    navigate('/dashboard/wallets/create/cat/existing');
  }

  return (
    <StyledRoot $expanded={expanded}>
      <StyledButtonContainer>
        <StyledMainButton onClick={toggle} data-testid="WalletsManageTokens-manage-token-list" fullWidth>
          <Box position="relative">
            <Trans>Manage token list</Trans>
            <StyledExpandButtonContainer>
              {expanded ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
            </StyledExpandButtonContainer>
          </Box>
        </StyledMainButton>
      </StyledButtonContainer>
      <StyledBody expanded={expanded}>
        <StyledContent>
          <Flex gap={1} alignItems="center">
            <Box flexGrow={1} ml={2}>
              <Search>
                <SearchIconWrapper>
                  <SearchIcon color="info" />
                </SearchIconWrapper>
                <StyledInputBase
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('Search...')}
                />
              </Search>
            </Box>
            <Box mr={2}>
              <Tooltip title={<Trans>Add Token</Trans>}>
                <IconButton onClick={handleAddToken} sx={sheet ? { color: 'text.primary' } : undefined}>
                  <Add color={sheet ? 'inherit' : 'info'} />
                </IconButton>
              </Tooltip>
            </Box>
          </Flex>
          <StyledListBody>
            <Flex flexDirection="column" alignItems="center" paddingLeft={2} paddingRight={2} paddingBottom={1}>
              {isLoading ? (
                <Spinner center />
              ) : (
                <Flex gap={sheet ? 0 : 1} flexDirection="column" width="100%">
                  {list?.map((listItem) => (
                    <WalletTokenCard item={listItem} key={listItem.id} onHide={hide} onShow={show} plain={sheet} />
                  ))}
                </Flex>
              )}
            </Flex>
          </StyledListBody>
        </StyledContent>
      </StyledBody>
    </StyledRoot>
  );
}

import { alpha, ListItem, ListItemIcon, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import React, { type ReactNode } from 'react';
import { useNavigate, useMatch } from 'react-router-dom';

import getColorModeValue from '../../utils/useColorModeValue';
import Flex from '../Flex';

type SidebarPaletteKey =
  | 'sidebarBackground'
  | 'sidebarSelectedFill'
  | 'sidebarIcon'
  | 'sidebarIconSelected'
  | 'sidebarIconHover'
  | 'sidebarText';

function paletteColor(theme: Theme, key: SidebarPaletteKey): string {
  return getColorModeValue(theme, key as Parameters<typeof getColorModeValue>[1]);
}

function selectedFill(theme: Theme): string {
  if (theme.palette.sidebarSelectedFill) {
    return paletteColor(theme, 'sidebarSelectedFill');
  }
  return paletteColor(theme, 'sidebarBackground');
}

function labelColor(theme: Theme): string {
  if (theme.palette.sidebarText) {
    return paletteColor(theme, 'sidebarText');
  }
  return paletteColor(theme, 'sidebarIcon');
}

const StyledListItemIcon = styled(ListItemIcon)<{ selected?: boolean }>`
  min-width: auto;
  position: relative;
  background-color: ${({ theme, selected }) => (selected ? selectedFill(theme) : 'transparent')};
  border-radius: ${({ theme }) => theme.spacing(1.25)};
  width: ${({ theme }) => theme.spacing(5.25)};
  height: ${({ theme }) => theme.spacing(5.25)};
  border: ${({ selected, theme }) =>
    selected ? `1px solid ${theme.palette.highlight.main}` : '1px solid transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    border-color 0.2s ease-in-out,
    background-color 0.2s ease-in-out;

  svg {
    color: ${({ selected, theme }) =>
      selected ? paletteColor(theme, 'sidebarIconSelected') : paletteColor(theme, 'sidebarIcon')};
  }
`;

const StyledListItem = styled(ListItem)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-left: 0;
  padding-right: 0;
  padding-top: ${({ theme }) => theme.spacing(0.5)};
  padding-bottom: ${({ theme }) => theme.spacing(0.5)};

  &:hover {
    background-color: transparent;
  }

  &:hover ${StyledListItemIcon} {
    background-color: ${({ theme }) => alpha(paletteColor(theme, 'sidebarIcon'), 0.12)};
    border-color: ${({ theme }) => alpha(paletteColor(theme, 'sidebarIconHover'), 0.55)};

    svg {
      color: ${({ theme }) => paletteColor(theme, 'sidebarIconHover')} !important;
    }
  }
`;

const StyledListItemText = styled(Typography)`
  font-size: ${({ theme }) => theme.typography.pxToRem(9.5)} !important;
  font-weight: 700;
  color: ${({ theme }) => labelColor(theme)};
`;

export type SideBarItemProps = {
  to: string;
  title: ReactNode;
  icon: any;
  onSelect?: () => void;
  end?: boolean;
};

export default function SideBarItem(props: SideBarItemProps) {
  const { to, title, icon: Icon, end = false, onSelect, ...rest } = props;
  const navigate = useNavigate();
  const match = useMatch({
    path: to,
    end,
  });

  const isSelected = !!match;

  async function handleClick() {
    if (onSelect) {
      await onSelect();
    }
    navigate(to);
  }

  return (
    <StyledListItem button onClick={() => handleClick()} {...rest}>
      <Flex flexDirection="column" alignItems="center" gap={0.25}>
        <StyledListItemIcon selected={isSelected}>
          <Icon fontSize="sidebarIcon" />
        </StyledListItemIcon>
        <StyledListItemText align="center">{title}</StyledListItemText>
      </Flex>
    </StyledListItem>
  );
}

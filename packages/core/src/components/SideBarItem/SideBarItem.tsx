import { alpha, ListItem, ListItemIcon, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { type ReactNode } from 'react';
import { useNavigate, useMatch } from 'react-router-dom';

import Color from '../../constants/Color';
import Flex from '../Flex';

const StyledListItemIcon = styled(ListItemIcon)`
  min-width: auto;
  position: relative;
  background-color: ${({ theme, selected }) =>
    selected ? (theme.palette.mode === 'dark' ? alpha('#d8ad45', 0.28) : alpha('#c7892a', 0.28)) : 'transparent'};
  border-radius: ${({ theme }) => theme.spacing(1.25)};
  width: ${({ theme }) => theme.spacing(5.25)};
  height: ${({ theme }) => theme.spacing(5.25)};
  border: ${({ selected, theme }) =>
    `1px solid ${selected ? alpha('#e6b756', 0.82) : alpha('#f7efd8', theme.palette.mode === 'dark' ? 0.16 : 0.18)}`};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ selected, theme }) =>
    selected ? `0 10px 24px ${alpha('#0f1a12', theme.palette.mode === 'dark' ? 0.26 : 0.24)}` : 'none'};
  transition:
    background-color 0.2s ease-in-out,
    border 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out,
    transform 0.2s ease-in-out;

  &::after {
    content: '';
    border-radius: ${({ theme }) => theme.spacing(1.25)};
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    box-shadow:
      0px -2px 4px ${alpha('#f1d37a', 0.41)},
      0px 1px 8px ${alpha('#e6b756', 0.5)};
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }

  svg {
    color: ${({ selected, theme }) =>
      selected
        ? theme.palette.mode === 'dark'
          ? '#fff3cf'
          : '#fff3cf'
        : theme.palette.mode === 'dark'
          ? theme.palette.sidebarIcon.dark
          : theme.palette.sidebarIcon.main};
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
    border-color: ${alpha('#e6b756', 0.82)};
    transform: translateY(-1px);

    svg {
      color: ${({ theme }) =>
        theme.palette.mode === 'dark'
          ? theme.palette.sidebarIconHover.dark
          : theme.palette.sidebarIconHover.main} !important;
    }

    &::after {
      opacity: 1;
    }
  }
`;

const StyledListItemText = styled(Typography)`
  font-size: ${({ theme }) => theme.typography.pxToRem(9.5)} !important;
  font-weight: 700;
  color: ${({ theme }) => (theme.palette.mode === 'dark' ? Color.Neutral[50] : alpha('#f7efd8', 0.82))};
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

import { Box } from '@mui/material';
import Menu, { MenuProps } from '@mui/material/Menu';
import { styled, alpha } from '@mui/material/styles';
import React, { type ReactNode } from 'react';

import Color from '../../constants/Color';

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color: theme.palette.mode === 'light' ? Color.Comet[700] : theme.palette.grey[300],
    boxShadow: `${Color.Neutral[50]} 0px 0px 0px 0px, ${alpha(Color.Neutral[900], 0.05)} 0px 0px 0px 1px, ${alpha(
      Color.Neutral[900],
      0.1
    )} 0px 10px 15px -3px, ${alpha(Color.Neutral[900], 0.05)} 0px 4px 6px -2px`,
    '& .MuiMenu-list': {
      padding: '4px 0',
    },
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      '&:active': {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
      },
    },
  },
}));

export type DropdownBaseProps = {
  children: (props: {
    onClose: () => void;
    onOpen: (event: React.MouseEvent<HTMLElement>) => void;
    onToggle: (event: React.MouseEvent<HTMLElement>) => void;
    open: boolean;
  }) => [ReactNode, ReactNode];
};

export default function DropdownBase(props: DropdownBaseProps) {
  const { children } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  function handleToggle(event: React.MouseEvent<HTMLElement>) {
    if (open) {
      handleClose();
    } else {
      handleOpen(event);
    }
  }

  const [item, menuItems] = children({
    onClose: handleClose,
    onOpen: handleOpen,
    onToggle: handleToggle,
    open,
  });

  return (
    <Box display="flex">
      {item}
      <StyledMenu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {menuItems}
      </StyledMenu>
    </Box>
  );
}

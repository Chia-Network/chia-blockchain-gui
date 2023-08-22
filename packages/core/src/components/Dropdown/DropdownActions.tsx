import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Button, { type ButtonProps } from '@mui/material/Button';
import { styled, alpha } from '@mui/material/styles';
import React, { cloneElement, type ReactNode, forwardRef } from 'react';

import Color from '../../constants/Color';
import { Menu, type MenuProps } from '../Menu';

const StyledMenu = styled((props: MenuProps) => (
  <Menu
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
    boxShadow: `${Color.Neutral[50]} 0px 0px 0px 0px, ${alpha(
      Color.Neutral[900],
      theme.palette.mode === 'dark' ? 0.15 : 0.05
    )} 0px 0px 0px 1px, ${alpha(
      Color.Neutral[900],
      theme.palette.mode === 'dark' ? 0.01 : 0.1
    )} 0px 10px 15px -3px, ${alpha(Color.Neutral[900], theme.palette.mode === 'dark' ? 0.15 : 0.05)} 0px 4px 6px -2px`,
    '& .MuiMenu-list': {
      padding: '4px 0',
    },
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        fontSize: 18,
        color: theme.palette.mode === 'dark' ? Color.Neutral[400] : Color.Neutral[500],
        marginRight: theme.spacing(1.5),
      },
      '&:active': {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
      },
    },
  },
}));

export type DropdownActionsProps = ButtonProps & {
  label?: ReactNode;
  toggle?: ReactNode;
  children: ReactNode;
  menuSx: any;
};

function DropdownActions(props: DropdownActionsProps, ref: any) {
  const { label, children, toggle, items, ...rest } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!Array.isArray(items) || items.length > 0) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  function handlePreventDefault(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div ref={ref}>
      {toggle ? (
        cloneElement(toggle, {
          onClick: handleClick,
        })
      ) : (
        <Button
          variant="contained"
          onClick={handleClick}
          endIcon={<KeyboardArrowDownIcon />}
          disableElevation
          {...rest}
        >
          {label}
        </Button>
      )}
      <StyledMenu anchorEl={anchorEl} open={open} onClose={handleClose} onClick={handlePreventDefault} sx={rest.menuSx}>
        {children}
      </StyledMenu>
    </div>
  );
}

export default forwardRef(DropdownActions);

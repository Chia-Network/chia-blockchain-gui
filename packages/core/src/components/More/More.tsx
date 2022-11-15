import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import React, { ReactNode } from 'react';

import IconButton from '../IconButton';
import { Menu, MenuProps } from '../Menu';

export type MoreProps = Omit<MenuProps, 'open'> & {
  children?: ReactNode;
  disabled?: boolean;
};

export default function More(props: MoreProps) {
  const { children, disabled = false, ...rest } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = !!anchorEl;

  function handleClick(event: React.MouseEvent<HTMLElement>) {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  return (
    <>
      <IconButton aria-label="more" aria-haspopup="true" onClick={handleClick} disabled={disabled}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} onClose={handleClose} {...rest} open={open}>
        {children}
      </Menu>
    </>
  );
}

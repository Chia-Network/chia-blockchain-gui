import { MenuItem as BaseMenuItem } from '@mui/material';
import type { MenuItemProps as BaseMenuItemsProps } from '@mui/material';
import React, { useContext, forwardRef, ReactNode } from 'react';

import { MenuContext } from '../Menu';
import type { MenuContextInterface } from '../Menu';
import Tooltip from '../Tooltip';

export type MenuItemProps = BaseMenuItemsProps & {
  close?: true | 'after';
  tooltip?: ReactNode;
};

function MenuItem(props: MenuItemProps, ref: any) {
  const { onClick, close, tooltip, ...rest } = props;

  const menuContext: MenuContextInterface | undefined = useContext(MenuContext);

  const handleClick = React.useCallback(
    async (event: React.MouseEvent<HTMLLIElement>) => {
      event.stopPropagation();

      if (close === true) {
        menuContext?.close(event, 'menuItemClick');
      }

      await onClick?.(event);

      if (close === 'after') {
        menuContext?.close(event, 'menuItemClick');
      }
    },
    [close, menuContext, onClick],
  );

  const onAuxClick = React.useMemo(() => {
    if (!rest.href) {
      return undefined;
    }
    return (event: React.MouseEvent<HTMLLIElement>) => {
      event.preventDefault();
      return handleClick(event);
    };
  }, [rest.href, handleClick]);

  const item = <BaseMenuItem {...rest} onClick={handleClick} onAuxClick={onAuxClick} ref={ref} />;

  if (tooltip) {
    return <Tooltip title={tooltip}>{item}</Tooltip>;
  }

  return item;
}

export default forwardRef(MenuItem);

import { Button, ButtonProps } from '@mui/material';
import React, { type ReactNode } from 'react';

import DropdownBase from './DropdownBase';

export type DropdownButtonProps = ButtonProps & {
  icon: ReactNode;
  children: (options: { onClose: () => void; open: boolean }) => ReactNode;
};

export default function DropdownButton(props: DropdownButtonProps) {
  const { children, icon, ...rest } = props;

  return (
    <DropdownBase>
      {({ onClose, onToggle, open }) => [
        <Button key="button" onClick={onToggle} {...rest}>
          {icon}
        </Button>,
        children({ onClose, open }),
      ]}
    </DropdownBase>
  );
}

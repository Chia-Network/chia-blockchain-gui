import { DropdownBase } from '@chia-network/core';
import { ArrowDropDown as ArrowDropDownIcon } from '@mui/icons-material';
import { Button, Box } from '@mui/material';
import React, { type ReactNode } from 'react';

export type FilterPillProps = {
  children: ReactNode;
  title: ReactNode;
};

export default function FilterPill(props: FilterPillProps) {
  const { children, title } = props;

  return (
    <DropdownBase>
      {({ onToggle }) => [
        <Button
          variant="outlined"
          key="button"
          onClick={onToggle}
          color="secondary"
          size="small"
          disableElevation
          sx={{
            borderColor: 'action.focus',
            backgroundColor: 'background.paper',
            color: 'text.primary',
          }}
        >
          {title}
          &nbsp;
          <ArrowDropDownIcon color="secondary" />
        </Button>,
        <Box sx={{ paddingX: 2, paddingY: 0.5 }}>{children}</Box>,
      ]}
    </DropdownBase>
  );
}

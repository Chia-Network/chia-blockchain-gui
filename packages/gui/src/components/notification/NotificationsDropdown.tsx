import { DropdownBase } from '@chia/core';
import { NotificationsNone as NotificationsNoneIcon } from '@mui/icons-material';
import { Badge, Box, Button } from '@mui/material';
import React from 'react';

import useNotifications from '../../hooks/useNotifications';
import NotificationsMenu from './NotificationsMenu';

export default function NotificationsDropdown() {
  const { unseenCount, setAsSeen } = useNotifications();

  return (
    <DropdownBase>
      {({ onClose, onToggle }) => [
        <Button
          key="button"
          onClick={(event) => {
            onToggle(event);
            setAsSeen();
          }}
          variant="outlined"
          color="secondary"
          size="small"
          sx={{ px: 1, minWidth: 0 }}
        >
          <Badge color="primary" badgeContent={unseenCount} invisible={!unseenCount}>
            <NotificationsNoneIcon color="secondary" />
          </Badge>
        </Button>,
        <Box sx={{ minWidth: 360 }}>
          <NotificationsMenu onClose={onClose} />
        </Box>,
      ]}
    </DropdownBase>
  );
}

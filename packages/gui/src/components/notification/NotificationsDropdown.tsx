import { DropdownBase } from '@chia-network/core';
import { Notification as NotificationIcon } from '@chia-network/icons';
import { Badge, Box, Button } from '@mui/material';
import React from 'react';

import useNotifications from '../../hooks/useNotifications';
import NotificationsMenu from './NotificationsMenu';

const buttonStyle = (theme) => ({
  minWidth: 0,
  borderColor: theme.palette.mode === 'dark' ? 'border.dark' : 'border.main',
  height: '40px',
  '&:hover': {
    borderColor: theme.palette.mode === 'dark' ? 'border.dark' : 'border.main',
  },
});

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
          sx={buttonStyle}
        >
          <Badge color="primary" badgeContent={unseenCount} invisible={!unseenCount}>
            <NotificationIcon />
          </Badge>
        </Button>,
        <Box sx={{ minWidth: 360 }}>
          <NotificationsMenu onClose={onClose} size={3} />
        </Box>,
      ]}
    </DropdownBase>
  );
}

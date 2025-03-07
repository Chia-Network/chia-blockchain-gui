import { DropdownBase, Tooltip } from '@chia-network/core';
import { Notification as NotificationIcon } from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { Badge, Box, Button } from '@mui/material';
import React from 'react';

import useValidNotifications from '../../hooks/useValidNotifications';

import NotificationsMenu from './NotificationsMenu';

const buttonStyle = (theme) => ({
  minWidth: 0,
  borderRadius: '8px',
  borderColor: theme.palette.mode === 'dark' ? 'border.dark' : 'border.main',
  width: '40px',
  minHeight: '40px',
  '&:hover': {
    borderColor: theme.palette.mode === 'dark' ? 'border.dark' : 'border.main',
  },
  padding: '0 8px',
});

export default function NotificationsDropdown() {
  const { unseenCount, setAsSeen } = useValidNotifications();

  return (
    <DropdownBase>
      {({ onClose, onToggle }) => [
        <Button
          key="button"
          onClick={(event) => {
            onToggle(event);
            setAsSeen();
          }}
          variant="text"
          color="secondary"
          size="small"
          sx={buttonStyle}
        >
          <Tooltip title={<Trans>Activity</Trans>}>
            <Badge color="primary" badgeContent={unseenCount} invisible={!unseenCount}>
              <NotificationIcon color="info" />
            </Badge>
          </Tooltip>
        </Button>,
        <Box sx={{ minWidth: 360 }}>
          <Tooltip title={<Trans>Activity</Trans>}>
            <NotificationsMenu onClose={onClose} size={5} />
          </Tooltip>
        </Box>,
      ]}
    </DropdownBase>
  );
}

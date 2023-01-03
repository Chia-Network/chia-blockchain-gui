import { Flex, Loading } from '@chia/core';
import { Trans } from '@lingui/macro';
import { Button, Typography, Divider } from '@mui/material';
import React from 'react';

import useNotifications from '../../hooks/useNotifications';
import Notification from './Notification';

export type NotificationsMenuProps = {
  onClose?: () => void;
};

export default function NotificationsMenu(props: NotificationsMenuProps) {
  const { onClose } = props;
  const { notifications = [], isLoading } = useNotifications();

  function handleSeeAllActivity() {
    const { ipcRenderer } = window as any;
    ipcRenderer.invoke('showNotification', {
      title: 'Chia',
      body: 'This is a notification',
    });
  }

  function handleClick() {
    onClose?.();
  }

  return (
    <Flex flexDirection="column" gap={1}>
      <Flex flexDirection="column" gap={1} paddingTop={1.5}>
        <Typography variant="h6" paddingX={2}>
          <Trans>Activity</Trans>
        </Typography>
        {isLoading ? (
          <Loading center />
        ) : notifications.length ? (
          <Flex flexDirection="column">
            {notifications.map((notification) => (
              <Notification key={notification.id} notification={notification} onClick={handleClick} />
            ))}
          </Flex>
        ) : null}
      </Flex>

      <Divider />

      <Flex>
        <Button onClick={handleSeeAllActivity} color="secondary" size="small" fullWidth>
          <Trans>See All Activity</Trans>
        </Button>
      </Flex>
    </Flex>
  );
}

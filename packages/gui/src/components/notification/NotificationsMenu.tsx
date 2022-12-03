import { Flex, Loading } from '@chia/core';
import { Trans } from '@lingui/macro';
import { CheckCircleTwoTone as CheckCircleTwoToneIcon } from '@mui/icons-material';
import { Button, Typography, Divider } from '@mui/material';
import React from 'react';

import useNotifications from '../../hooks/useNotifications';

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

  return (
    <Flex flexDirection="column" gap={1}>
      <Flex flexDirection="column" gap={1} paddingX={2} paddingY={1.5}>
        <Typography variant="h6">
          <Trans>Activity</Trans>
        </Typography>
        {isLoading ? (
          <Loading center />
        ) : notifications.length ? (
          <Flex flexDirection="column">
            {notifications.map((notification) => (
              <Flex alignItems="center" key={notification.id} justifyContent="space-between">
                <Flex alignItems="center" gap={1}>
                  <CheckCircleTwoToneIcon color="primary" />
                </Flex>
                {notification.message}
              </Flex>
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

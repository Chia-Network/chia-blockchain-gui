import { Flex, Loading } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Button, Typography, Divider } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router';

import useNotifications from '../../hooks/useNotifications';
import Notification from './Notification';

export type NotificationsMenuProps = {
  onClose?: () => void;
  size?: number;
};

export default function NotificationsMenu(props: NotificationsMenuProps) {
  const { onClose, size = 7 } = props;
  const navigate = useNavigate();
  const { notifications = [], isLoading } = useNotifications();

  function handleSeeAllActivity() {
    navigate('/dashboard/offers');
  }

  function handleClick() {
    onClose?.();
  }

  const latestNotifications = notifications.slice(0, size);
  const hasMore = notifications.length > size;

  return (
    <Flex flexDirection="column" gap={1}>
      <Flex flexDirection="column" gap={1} paddingTop={1.5}>
        <Typography variant="h6" paddingX={2}>
          <Trans>Activity</Trans>
        </Typography>
        {isLoading ? (
          <Flex flexDirection="column" minHeight="4rem">
            <Loading center />
          </Flex>
        ) : notifications.length ? (
          <Flex flexDirection="column">
            {latestNotifications.map((notification) => (
              <Notification key={notification.id} notification={notification} onClick={handleClick} />
            ))}
          </Flex>
        ) : (
          <Typography paddingX={2} paddingY={2} color="textSecondary">
            <Trans>No activities yet</Trans>
          </Typography>
        )}
      </Flex>

      {hasMore && (
        <>
          <Divider />

          <Flex>
            <Button onClick={handleSeeAllActivity} color="secondary" size="small" fullWidth>
              <Trans>See All Activity</Trans>
            </Button>
          </Flex>
        </>
      )}
    </Flex>
  );
}

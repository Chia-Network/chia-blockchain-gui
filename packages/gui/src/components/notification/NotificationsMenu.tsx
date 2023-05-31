import { Flex, Loading } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Button, Typography, Divider } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router';

import useValidNotifications from '../../hooks/useValidNotifications';
import Notification from './Notification';

export type NotificationsMenuProps = {
  onClose?: () => void;
  size?: number;
};

export default function NotificationsMenu(props: NotificationsMenuProps) {
  const { onClose, size = 7 } = props;
  const navigate = useNavigate();
  const { notifications = [], isLoading } = useValidNotifications();

  function handleSeeAllActivity() {
    onClose?.();
    navigate('/dashboard/offers');
  }

  function handleClick() {
    onClose?.();
  }

  const limited = notifications.slice(0, size);
  const hasMore = notifications.length > size;

  return (
    <Flex flexDirection="column" gap={1}>
      <Flex flexDirection="column" gap={1} paddingTop={1.5}>
        <Typography variant="h6" paddingX={2}>
          <Trans>Activity</Trans>
        </Typography>
        {!!notifications.length && (
          <Flex flexDirection="column">
            {limited.map((notification) => (
              <Notification key={notification.id} notification={notification} onClick={handleClick} />
            ))}
          </Flex>
        )}

        {isLoading ? (
          <Flex flexDirection="column" minHeight="3rem">
            <Loading center />
          </Flex>
        ) : !notifications.length ? (
          <Typography paddingX={2} paddingY={2} color="textSecondary">
            <Trans>No activities yet</Trans>
          </Typography>
        ) : null}
      </Flex>

      {hasMore && (
        <>
          <Divider />
          <Flex>
            <Button onClick={handleSeeAllActivity} variant="text" color="secondary" size="small" fullWidth>
              <Trans>See All Activity</Trans>
            </Button>
          </Flex>
        </>
      )}
    </Flex>
  );
}

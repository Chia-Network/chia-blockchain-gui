import { Flex, Loading } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Button, Typography, Divider } from '@mui/material';
import React, { useCallback, useState, useMemo } from 'react';
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
    onClose?.();
    navigate('/dashboard/offers');
  }

  function handleClick() {
    onClose?.();
  }

  const [hiddenNotifications, setHiddenNotifications] = useState<Record<string, boolean>>({});

  const hideNotification = useCallback((id: string) => {
    setHiddenNotifications((prevNotifications) => ({
      ...prevNotifications,
      [id]: true,
    }));
  }, []);

  // get the latest notifications that are not hidden
  const latestNotifications = useMemo(
    () => notifications.filter((notification) => !hiddenNotifications[notification.id]).slice(0, size),
    [notifications, hiddenNotifications, size]
  );

  const hasMore = notifications.length > size;

  return (
    <Flex flexDirection="column" gap={1}>
      <Flex flexDirection="column" gap={1} paddingTop={1.5}>
        <Typography variant="h6" paddingX={2}>
          <Trans>Activity</Trans>
        </Typography>
        {!!notifications.length && (
          <Flex flexDirection="column">
            {latestNotifications.map((notification) => (
              <Notification
                key={notification.id}
                notification={notification}
                onClick={handleClick}
                onHide={hideNotification}
              />
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
            <Button onClick={handleSeeAllActivity} color="secondary" size="small" fullWidth>
              <Trans>See All Activity</Trans>
            </Button>
          </Flex>
        </>
      )}
    </Flex>
  );
}

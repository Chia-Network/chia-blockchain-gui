import { Flex, useOpenDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { InsertComment as InsertCommentIcon, Link as LinkIcon } from '@mui/icons-material';
import { Typography } from '@mui/material';
import React from 'react';

import type Notification from '../../@types/Notification';
import NotificationType from '../../constants/NotificationType';
import HumanTimestamp from '../helpers/HumanTimestamp';
import NotificationAnnouncementDialog from './NotificationAnnouncementDialog';
import NotificationPreview from './NotificationPreview';
import NotificationWrapper from './NotificationWrapper';

export type NotificationAnnouncementProps = {
  notification: Notification;
  onClick?: () => void;
};

export default function NotificationAnnouncement(props: NotificationAnnouncementProps) {
  const {
    onClick,
    notification,
    notification: { type, timestamp },
  } = props;

  if (type !== NotificationType.ANNOUNCEMENT) {
    throw new Error('NotificationAnnouncement can only be used with ANNOUNCEMENT notifications');
  }

  const openDialog = useOpenDialog();

  const message = 'message' in notification ? notification.message : undefined;
  const url = 'url' in notification ? notification.url : undefined;

  async function handleClick() {
    onClick?.();

    await openDialog(<NotificationAnnouncementDialog notification={notification} />);
  }

  return (
    <NotificationWrapper
      onClick={handleClick}
      icon={
        <NotificationPreview
          notification={notification}
          fallback={<InsertCommentIcon sx={{ fontSize: '32px !important' }} />}
        />
      }
    >
      <Flex flexDirection="column" minWidth={0} flexBasis={0} maxWidth={320}>
        <Typography variant="body2" color="textSecondary">
          <Trans>Dapp sending the message</Trans>
          {' · '}
          <HumanTimestamp value={timestamp} fromNow />
        </Typography>
        <Flex flexDirection="row" gap={1} alignItems="center">
          <Typography variant="body2" noWrap>
            {message} fdgdfgdfg df gdg dg df g
          </Typography>
          {url ? <LinkIcon /> : null}
        </Flex>
      </Flex>
    </NotificationWrapper>
  );
}

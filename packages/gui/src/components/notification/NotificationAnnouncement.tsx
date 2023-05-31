import { Flex, useOpenDialog, Mute } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { InsertComment as InsertCommentIcon, Link as LinkIcon } from '@mui/icons-material';
import { Typography } from '@mui/material';
import React from 'react';

import { type NotificationAnnouncement as NotificationAnnouncementType } from '../../@types/Notification';
import NotificationType from '../../constants/NotificationType';
import HumanTimestamp from '../helpers/HumanTimestamp';
import NotificationAnnouncementDialog from './NotificationAnnouncementDialog';
import NotificationPreview from './NotificationPreview';
import NotificationWrapper from './NotificationWrapper';

export type NotificationAnnouncementProps = {
  notification: NotificationAnnouncementType;
  onClick?: () => void;
};

export default function NotificationAnnouncement(props: NotificationAnnouncementProps) {
  const {
    onClick,
    notification,
    notification: { type, timestamp, message, url, from = 'Dapp' },
  } = props;

  if (type !== NotificationType.ANNOUNCEMENT) {
    throw new Error('NotificationAnnouncement can only be used with ANNOUNCEMENT notifications');
  }

  const openDialog = useOpenDialog();

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
        <Flex flexDirection="row" gap={1} alignItems="center">
          <Typography variant="subtitle2" sx={{ wordWrap: 'break-word' }}>
            <Trans>
              {from} <Mute>sending the message</Mute>
            </Trans>
            {' · '}
            <Mute>
              <HumanTimestamp value={timestamp} fromNow />
            </Mute>
          </Typography>{' '}
        </Flex>
        <Flex flexDirection="row" gap={1} alignItems="center">
          <Typography variant="body2">
            {message} {url ? <LinkIcon sx={{ verticalAlign: 'middle' }} /> : null}
          </Typography>
        </Flex>
      </Flex>
    </NotificationWrapper>
  );
}

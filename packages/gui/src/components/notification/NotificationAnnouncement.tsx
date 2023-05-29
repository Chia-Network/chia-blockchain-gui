import { Flex, useOpenExternal, useOpenDialog, ConfirmDialog } from '@chia-network/core';
import { Offers as OffersIcon } from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React from 'react';

import type Notification from '../../@types/Notification';
import NotificationType from '../../constants/NotificationType';
import HumanTimestamp from '../helpers/HumanTimestamp';
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

  const openExternal = useOpenExternal();
  const openDialog = useOpenDialog();

  const message = 'message' in notification ? notification.message : undefined;
  const url = 'url' in notification ? notification.url : undefined;

  async function handleClick() {
    onClick?.();

    const canProcess = await openDialog(
      <ConfirmDialog title={<Trans>Hang On</Trans>} confirmTitle={<Trans>Yes</Trans>} confirmColor="primary">
        <Trans>This link will take you to {url}. Are you sure you want to go there?</Trans>
      </ConfirmDialog>
    );

    if (canProcess) {
      openExternal(url);
    }
  }

  return (
    <NotificationWrapper
      onClick={handleClick}
      icon={
        <NotificationPreview
          notification={notification}
          fallback={<OffersIcon sx={{ fontSize: '32px !important' }} />}
        />
      }
    >
      <Flex flexDirection="column" minWidth={0} flexBasis={0} maxWidth={320}>
        <Typography variant="body2" color="textSecondary">
          <Trans>Dapp sending the message</Trans>
          {' · '}
          <HumanTimestamp value={timestamp} fromNow />
        </Typography>
        <Typography variant="body2">{message}</Typography>
      </Flex>
    </NotificationWrapper>
  );
}

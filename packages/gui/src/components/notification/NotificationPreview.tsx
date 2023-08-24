import React from 'react';

import type Notification from '../../@types/Notification';
import NotificationType from '../../constants/NotificationType';

import NotificationPreviewOffer from './NotificationPreviewOffer';

export type NotificationPreviewProps = {
  notification: Notification;
  size?: number;
  fallback?: JSX.Element;
  requested?: boolean;
};

export default function NotificationPreview(props: NotificationPreviewProps) {
  const {
    notification,
    size = 40,
    fallback = null,
    requested = false,
    notification: { type },
  } = props;

  if ([NotificationType.OFFER, NotificationType.COUNTER_OFFER].includes(type)) {
    return (
      <NotificationPreviewOffer notification={notification} size={size} fallback={fallback} requested={requested} />
    );
  }

  return fallback;
}

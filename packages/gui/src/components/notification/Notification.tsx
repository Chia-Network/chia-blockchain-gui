import React from 'react';

import type NotificationData from '../../@types/Notification';
import NotificationType from '../../constants/NotificationType';
import NotificationAnnouncement from './NotificationAnnouncement';
import NotificationOffer from './NotificationOffer';

export type NotificationProps = {
  notification: NotificationData;
  onClick?: () => void;
  onHide?: (notificationId: string) => void;
};

export default function Notification(props: NotificationProps) {
  const {
    onClick,
    notification,
    notification: { type },
    onHide,
  } = props;

  function handleHide() {
    onHide?.(notification.id);
  }

  if (type === NotificationType.OFFER || type === NotificationType.COUNTER_OFFER) {
    return <NotificationOffer notification={notification} onClick={onClick} onHide={handleHide} />;
  }

  if (type === NotificationType.ANNOUNCEMENT) {
    return <NotificationAnnouncement notification={notification} onClick={onClick} onHide={handleHide} />;
  }

  return null;
}

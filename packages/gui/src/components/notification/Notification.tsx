import React from 'react';

import type NotificationData from '../../@types/Notification';
import NotificationType from '../../constants/NotificationType';

import NotificationAnnouncement from './NotificationAnnouncement';
import NotificationOffer from './NotificationOffer';

export type NotificationProps = {
  notification: NotificationData;
  onClick?: () => void;
};

export default function Notification(props: NotificationProps) {
  const { onClick, notification } = props;

  if (notification.type === NotificationType.OFFER || notification.type === NotificationType.COUNTER_OFFER) {
    return <NotificationOffer notification={notification} onClick={onClick} />;
  }

  if (notification.type === NotificationType.ANNOUNCEMENT) {
    return <NotificationAnnouncement notification={notification} onClick={onClick} />;
  }

  return null;
}

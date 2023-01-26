import NotificationType from '../constants/NotificationType';

export default function parseNotification(message: string) {
  const { t: type = 1, ...rest } = JSON.parse(message);
  switch (type) {
    case NotificationType.OFFER:
    case NotificationType.COUNTER_OFFER: {
      const { u: url, v: version = 1, ph: puzzleHash, ...notificationRest } = rest;
      return { type, url, version, puzzleHash, ...notificationRest };
    }
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
}

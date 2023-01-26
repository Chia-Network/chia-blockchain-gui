import NotificationType from '../constants/NotificationType';

export default function parseNotification(message: string) {
  const { t: type = 1, v: version = 1, d: data } = JSON.parse(message);
  switch (type) {
    case NotificationType.OFFER:
    case NotificationType.COUNTER_OFFER: {
      const { ph: puzzleHash, u: url, ...notificationRest } = data;
      return { type, version, data: { url, puzzleHash }, ...notificationRest };
    }
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
}

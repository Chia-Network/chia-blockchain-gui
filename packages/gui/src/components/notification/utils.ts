import { t } from '@lingui/macro';

import NotificationType from '../../constants/NotificationType';

const NOTIFICATION_MESSAGE_VERSION = 1;

export enum NotificationTypeId {
  OFFER = 1,
}

type NotificationOfferData = {
  u: string; // offer URL
  ph?: string; // puzzlehash of the notification sender, for sending a response (counter offer)
};

type NotificationData = NotificationOfferData;

// The notification message payload is a JSON object with the following fields:
//
// - `v`: <number> version of the notification message. Currently 1.
// - `t`: <number> type of the notification message. Currently 1 for offer.
// - `d`: <object> payload of the notification message. The type of the payload
//   depends on the notification type. For offer, the payload is an object with
//   the following fields:
//   - `u`: <string> offer URL
//   - `ph`: <string, optional> puzzlehash of the notification sender, for sending
//     a response (counter offer)
//

export function createNotificationOfferData({
  offerURL,
  puzzleHash,
}: {
  offerURL: string;
  puzzleHash?: string;
}): NotificationOfferData {
  return {
    u: offerURL,
    ...(puzzleHash ? { ph: puzzleHash } : {}),
  };
}

export function createNotificationPayload(type: NotificationTypeId, data: NotificationData): string {
  return JSON.stringify({
    v: NOTIFICATION_MESSAGE_VERSION,
    t: type,
    d: data,
  });
}

export function createOfferNotificationPayload({
  offerURL,
  puzzleHash,
}: {
  offerURL: string;
  puzzleHash?: string;
}): string {
  return createNotificationPayload(NotificationTypeId.OFFER, createNotificationOfferData({ offerURL, puzzleHash }));
}

export function parseNotificationPayload(payload: string): { type: NotificationTypeId; data: NotificationData } | null {
  try {
    const { v, t: notificationType, d } = JSON.parse(payload);
    if (v !== NOTIFICATION_MESSAGE_VERSION) {
      return null;
    }
    return { type: notificationType, data: d };
  } catch (e) {
    return null;
  }
}

export function parseNotificationOfferData(payload: string): NotificationOfferData | null {
  const parsed = parseNotificationPayload(payload);
  if (!parsed) {
    return null;
  }

  if (parsed.type !== NotificationTypeId.OFFER) {
    return null;
  }

  return {
    u: parsed.data?.u ?? '',
    ph: parsed.data?.ph,
  };
}

export function pushNotificationStringsForNotificationType(
  notificationType: NotificationType,
  debug = false
): {
  title: string;
  body: string;
} {
  let title;
  let body;

  switch (notificationType) {
    case NotificationType.OFFER:
      title = t`New offer`;
      body = t`You have received a new offer`;
      break;
    case NotificationType.COUNTER_OFFER:
      title = t`New counter offer`;
      body = t`You have received a new counter offer`;
      break;
    default:
      throw new Error(`Unknown notification type: ${notificationType}`);
  }

  if (debug) {
    title = `[DEBUG] ${title}`;
    body = `[DEBUG] ${body}`;
  }

  return {
    title,
    body,
  };
}

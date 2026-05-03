import NotificationType from '../../constants/NotificationType';

import type { PairRecord } from './types';

type NotificationBase = {
  timestamp: number;
  id: string;
  source: 'WALLET_CONNECT';
  fingerprints?: number[];
  from?: string;
};

type NotificationOffer = NotificationBase & {
  type: NotificationType.OFFER;
  offerData: string;
};

type NotificationAnnouncement = NotificationBase & {
  type: NotificationType.ANNOUNCEMENT;
  message: string;
  url?: string;
};

/** Wire-safe Notification payload main sends over IPC. The renderer's
 *  shared `Notification` type also accepts `from: ReactNode` and other
 *  variants; this is the subset main can construct. */
export type ShowNotificationPayload = NotificationOffer | NotificationAnnouncement;

/**
 * Construct a Notification from main's PairRecord + the dapp's payload.
 * Returns `null` if the payload is malformed (bad type, missing fields)
 * — main logs and skips rather than throwing, so a hostile dapp can't
 * crash the dispatch handler with garbage notifications.
 *
 * Lives in main alongside the gate so the security boundary and the
 * action sit in the same process. Renderer used to do this construction;
 * pulling it here means a compromised renderer can't fabricate a
 * notification from a non-paired dapp.
 */
export function buildShowNotification(
  pair: PairRecord,
  payload: Record<string, unknown>,
  requestFingerprint?: number,
): ShowNotificationPayload | null {
  const type = payload.type;
  const allFingerprints = payload.allFingerprints === true;
  const fingerprints = allFingerprints
    ? pair.fingerprints
    : requestFingerprint !== undefined
      ? [requestFingerprint]
      : pair.fingerprints;

  const from = pair.metadata?.name;
  const timestamp = Math.floor(Date.now() / 1000);
  const id = `wc-${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
  const base = { from, timestamp, id, source: 'WALLET_CONNECT' as const, fingerprints };

  if (type === NotificationType.OFFER) {
    const offerData = payload.offerData;
    if (typeof offerData !== 'string' || !offerData) return null;
    return { ...base, type: NotificationType.OFFER, offerData };
  }

  if (type === NotificationType.ANNOUNCEMENT) {
    const message = payload.message;
    if (typeof message !== 'string' || !message) return null;
    const urlRaw = payload.url;
    const url = typeof urlRaw === 'string' && urlRaw ? urlRaw : undefined;
    return { ...base, type: NotificationType.ANNOUNCEMENT, message, url };
  }

  return null;
}

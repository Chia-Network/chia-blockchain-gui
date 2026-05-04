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

/** Subset of the renderer's Notification shape that main can construct. */
export type ShowNotificationPayload = NotificationOffer | NotificationAnnouncement;

// Returns null on malformed payloads so a hostile dapp can't crash dispatch.
export function buildShowNotification(
  pair: PairRecord,
  payload: Record<string, unknown>,
  requestFingerprint?: number,
): ShowNotificationPayload | null {
  const { type } = payload;
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
    const { offerData } = payload;
    if (typeof offerData !== 'string' || !offerData) return null;
    return { ...base, type: NotificationType.OFFER, offerData };
  }

  if (type === NotificationType.ANNOUNCEMENT) {
    const { message } = payload;
    if (typeof message !== 'string' || !message) return null;
    const urlRaw = payload.url;
    const url = typeof urlRaw === 'string' && urlRaw ? urlRaw : undefined;
    return { ...base, type: NotificationType.ANNOUNCEMENT, message, url };
  }

  return null;
}

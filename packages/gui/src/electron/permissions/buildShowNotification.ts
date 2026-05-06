import { WcError, WcErrorCode } from '../../@types/WcError';
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

// Throws WcError(INVALID_PARAMS) on malformed payloads so the dapp sees a
// real failure instead of a misleading `success: true`. Keys are snake_case
// — dispatchAsPair canonicalises before any field read.
export function buildShowNotification(
  pair: PairRecord,
  payload: Record<string, unknown>,
  requestFingerprint?: number,
): ShowNotificationPayload {
  const { type } = payload;
  const allFingerprints = payload.all_fingerprints === true;
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
    const offerData = payload.offer_data;
    if (typeof offerData !== 'string' || !offerData) {
      throw new WcError('offer notification missing offer_data', WcErrorCode.INVALID_PARAMS);
    }
    return { ...base, type: NotificationType.OFFER, offerData };
  }

  if (type === NotificationType.ANNOUNCEMENT) {
    const { message } = payload;
    if (typeof message !== 'string' || !message) {
      throw new WcError('announcement notification missing message', WcErrorCode.INVALID_PARAMS);
    }
    const urlRaw = payload.url;
    const url = typeof urlRaw === 'string' && urlRaw ? urlRaw : undefined;
    return { ...base, type: NotificationType.ANNOUNCEMENT, message, url };
  }

  throw new WcError(`unknown notification type: ${String(type)}`, WcErrorCode.INVALID_PARAMS);
}

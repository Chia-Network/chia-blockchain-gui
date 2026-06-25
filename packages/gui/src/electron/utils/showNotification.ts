import type { PermissionsNotificationPayload } from '../../@types/PermissionsService';
import NotificationType from '../../constants/NotificationType';
import type { DappCommandHandlerContext } from '../commands/Commands';

import isValidURL from './isValidURL';

export type ShowNotificationParams = Record<string, unknown> & {
  type?: unknown;
  message?: unknown;
  url?: unknown;
  offer_data?: unknown;
  all_fingerprints?: unknown;
};

function createNotificationPayload(
  params: Record<string, unknown>,
  context: DappCommandHandlerContext,
): PermissionsNotificationPayload {
  const { type } = params as ShowNotificationParams;

  const timestamp = Math.floor(Date.now() / 1000);

  const fingerprints = [context.pair.fingerprint];

  const base = {
    timestamp,
    fingerprints,
    from: context.pair.metadata.name,
    source: 'WALLET_CONNECT' as const,
    id: `wc-${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`,
  };

  if (type === NotificationType.OFFER) {
    const { offer_data: offerData } = params;

    if (typeof offerData !== 'string' || !offerData) {
      throw new Error('Notification missing offer_data');
    }

    return {
      ...base,
      type,
      offerData,
    };
  }

  if (type === NotificationType.ANNOUNCEMENT) {
    const { message, url } = params;
    if (typeof message !== 'string' || !message) {
      throw new Error('Notification missing message');
    }

    if (url !== undefined && (typeof url !== 'string' || !isValidURL(url))) {
      throw new Error('Notification url must be a string');
    }

    return {
      ...base,
      type,
      message,
      url,
    };
  }

  throw new Error(`Invalid notification type ${type}`);
}

export async function showNotification(params: ShowNotificationParams, context: DappCommandHandlerContext) {
  const notification = createNotificationPayload(params, context);

  context.sendNotification(notification);

  return { success: true };
}

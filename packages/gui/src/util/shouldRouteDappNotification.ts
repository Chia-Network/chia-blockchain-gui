import type { PermissionsNotificationPayload } from '../@types/PermissionsService';
import NotificationType from '../constants/NotificationType';

export type DappNotificationPrefs = {
  dappOfferNotifications: boolean;
  dappAnnouncementNotifications: boolean;
};

// User-side mute layer. Independent of pairing-level grants — a paired dapp
// can pass main's gate and still be silenced here.
export default function shouldRouteDappNotification(
  notification: PermissionsNotificationPayload,
  prefs: DappNotificationPrefs,
): boolean {
  if (notification.type === NotificationType.OFFER) return prefs.dappOfferNotifications;
  if (notification.type === NotificationType.ANNOUNCEMENT) return prefs.dappAnnouncementNotifications;
  return true;
}

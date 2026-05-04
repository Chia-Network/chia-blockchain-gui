import type { PermissionsNotificationPayload } from '../@types/PermissionsService';

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
  if (notification.type === 'offer') return prefs.dappOfferNotifications;
  if (notification.type === 'announcement') return prefs.dappAnnouncementNotifications;
  return true;
}

import type { PermissionsNotificationPayload } from '../@types/PermissionsService';
import NotificationType from '../constants/NotificationType';

import shouldRouteDappNotification from './shouldRouteDappNotification';

const offerNotification: PermissionsNotificationPayload = {
  type: NotificationType.OFFER,
  timestamp: 1,
  id: 'wc-1',
  source: 'WALLET_CONNECT',
  offerData: 'offer1abc...',
};

const announcementNotification: PermissionsNotificationPayload = {
  type: NotificationType.ANNOUNCEMENT,
  timestamp: 1,
  id: 'wc-2',
  source: 'WALLET_CONNECT',
  message: 'hello',
};

describe('shouldRouteDappNotification', () => {
  it('routes an offer when dappOfferNotifications is true', () => {
    expect(
      shouldRouteDappNotification(offerNotification, {
        dappOfferNotifications: true,
        dappAnnouncementNotifications: true,
      }),
    ).toBe(true);
  });

  it('drops an offer when dappOfferNotifications is false', () => {
    expect(
      shouldRouteDappNotification(offerNotification, {
        dappOfferNotifications: false,
        dappAnnouncementNotifications: true,
      }),
    ).toBe(false);
  });

  it('routes an announcement when dappAnnouncementNotifications is true', () => {
    expect(
      shouldRouteDappNotification(announcementNotification, {
        dappOfferNotifications: true,
        dappAnnouncementNotifications: true,
      }),
    ).toBe(true);
  });

  it('drops an announcement when dappAnnouncementNotifications is false', () => {
    expect(
      shouldRouteDappNotification(announcementNotification, {
        dappOfferNotifications: true,
        dappAnnouncementNotifications: false,
      }),
    ).toBe(false);
  });

  it('the two prefs gate independently', () => {
    // Offers off, announcements on → only announcements get through.
    const offerOff = {
      dappOfferNotifications: false,
      dappAnnouncementNotifications: true,
    };
    expect(shouldRouteDappNotification(offerNotification, offerOff)).toBe(false);
    expect(shouldRouteDappNotification(announcementNotification, offerOff)).toBe(true);

    // Inverse.
    const announcementOff = {
      dappOfferNotifications: true,
      dappAnnouncementNotifications: false,
    };
    expect(shouldRouteDappNotification(offerNotification, announcementOff)).toBe(true);
    expect(shouldRouteDappNotification(announcementNotification, announcementOff)).toBe(false);
  });

  it('routes unknown future types by default (forward-compatible)', () => {
    // If main starts emitting a new type one day, we don't want a stale
    // renderer to silently drop it. Default to "show".
    const future = { ...offerNotification, type: 'futureType' as unknown as NotificationType.OFFER };
    expect(
      shouldRouteDappNotification(future, {
        dappOfferNotifications: false,
        dappAnnouncementNotifications: false,
      }),
    ).toBe(true);
  });
});

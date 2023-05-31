import { useEffect, useState } from 'react';

import type Notification from '../@types/Notification';
import type OfferState from '../@types/OfferState';
import NotificationType from '../constants/NotificationType';
import useNotifications from './useNotifications';
import useOffers from './useOffers';

function getOfferId(notification: Notification) {
  if ([NotificationType.OFFER, NotificationType.COUNTER_OFFER].includes(notification.type)) {
    return 'offerURL' in notification
      ? notification.offerURL
      : 'offerData' in notification
      ? notification.offerData
      : undefined;
  }

  throw new Error('Notification is not an offer');
}

function filterNotifications(notifications: Notification[], getOffer: (offerId: string | undefined) => OfferState) {
  return notifications.filter((notification) => {
    if ([NotificationType.OFFER, NotificationType.COUNTER_OFFER].includes(notification.type)) {
      const offerId = getOfferId(notification);
      const offerState = getOffer(offerId);
      return !!offerState.offer?.valid;
    }

    return true;
  });
}

export default function useValidNotifications() {
  const { notifications, ...rest } = useNotifications();
  const { getOffer, subscribeToChanges } = useOffers();

  const [validNotifications, setValidNotifications] = useState(() => filterNotifications(notifications, getOffer));

  useEffect(() => {
    setValidNotifications(filterNotifications(notifications, getOffer));
  }, [notifications, getOffer]);

  // subscribe to offer state changes
  useEffect(() => {
    const offerNotifications = notifications.filter((notification) =>
      [NotificationType.OFFER, NotificationType.COUNTER_OFFER].includes(notification.type)
    );

    const unsubsribers = offerNotifications.map((notification) =>
      subscribeToChanges(getOfferId(notification), () => {
        setValidNotifications(filterNotifications(notifications, getOffer));
      })
    );

    return () => {
      unsubsribers.forEach((unsubsriber) => unsubsriber());
    };
  }, [getOffer, notifications, subscribeToChanges]);

  return {
    notifications: validNotifications,
    ...rest,
  };
}

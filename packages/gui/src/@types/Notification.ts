import { type ReactNode } from 'react';

import NotificationType from '../constants/NotificationType';

type NotificationBase = {
  timestamp: number;
  id: string;
  source: 'WALLET_CONNECT' | 'BLOCKCHAIN';
  fingerprints?: number[];
  from?: ReactNode;
};

type OfferDataOrUrl =
  | {
      offerData: string;
    }
  | {
      offerURL: string;
    };

type NotificationOffer = NotificationBase &
  OfferDataOrUrl & {
    type: NotificationType.OFFER;
  };

type NotificationCounterOffer = NotificationBase &
  OfferDataOrUrl & {
    type: NotificationType.COUNTER_OFFER;
    puzzleHash: string;
  };

type NotificationAnnouncement = NotificationBase & {
  type: NotificationType.ANNOUNCEMENT;
  message: string;
  url?: string;
};

type Notification = NotificationOffer | NotificationCounterOffer | NotificationAnnouncement;

export default Notification;

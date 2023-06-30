import { Loading } from '@chia-network/core';
import React, { useMemo } from 'react';

import Notification from '../../@types/Notification';
import NotificationType from '../../constants/NotificationType';
import useOffer from '../../hooks/useOffer';
import offerToOfferBuilderData from '../../util/offerToOfferBuilderData';
import NotificationPreviewNFT from './NotificationPreviewNFT';

type NotificationPreviewOfferProps = {
  notification: Notification;
  size?: number;
  fallback?: JSX.Element;
  requested?: boolean;
};

export default function NotificationPreviewOffer(props: NotificationPreviewOfferProps) {
  const {
    notification,
    size = 40,
    fallback = null,
    requested = false,
    notification: { type },
  } = props;

  const offerURLOrData =
    'offerURL' in notification
      ? notification.offerURL
      : 'offerData' in notification
      ? notification.offerData
      : undefined;

  const { offer, isLoading } = useOffer(offerURLOrData);

  const nft = useMemo(() => {
    if (!offer || !offer.summary) {
      return null;
    }

    const offerBuilderData = offerToOfferBuilderData(offer?.summary);
    const side = requested ? offerBuilderData.offered : offerBuilderData.requested;

    const [firstNFT] = side.nfts ?? [];

    return firstNFT || null;
  }, [offer, requested]);

  if (![NotificationType.OFFER, NotificationType.COUNTER_OFFER].includes(type)) {
    return fallback;
  }

  if (!offerURLOrData) {
    return fallback;
  }

  if (isLoading) {
    return <Loading size={size} />;
  }

  if (nft) {
    return <NotificationPreviewNFT nftId={nft.nftId} size={size} />;
  }

  return fallback;
}

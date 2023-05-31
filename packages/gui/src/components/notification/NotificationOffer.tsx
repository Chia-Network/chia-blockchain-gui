import { Flex } from '@chia-network/core';
import { Offers as OffersIcon } from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  type NotificationCounterOffer,
  type NotificationOffer as NotificationOfferType,
} from '../../@types/Notification';
import NotificationType from '../../constants/NotificationType';
import useOffer from '../../hooks/useOffer';
import HumanTimestamp from '../helpers/HumanTimestamp';
import OfferDetails from '../offers2/OfferDetails';
import NotificationPreview from './NotificationPreview';
import NotificationWrapper from './NotificationWrapper';

export type NotificationOfferProps = {
  notification: NotificationCounterOffer | NotificationOfferType;
  onClick?: () => void;
};

export default function NotificationOffer(props: NotificationOfferProps) {
  const {
    onClick,
    notification,
    notification: { type, timestamp },
  } = props;

  const offerURLOrData =
    'offerURL' in notification
      ? notification.offerURL
      : 'offerData' in notification
      ? notification.offerData
      : undefined;

  if (!offerURLOrData) {
    throw new Error('NotificationOffer can only be used with OFFER notifications');
  }

  if (![NotificationType.OFFER, NotificationType.COUNTER_OFFER].includes(type)) {
    throw new Error('NotificationOffer can only be used with OFFER notifications');
  }

  const { offer, isLoading, error } = useOffer(offerURLOrData);

  const canCounterOffer =
    type === NotificationType.COUNTER_OFFER && 'puzzleHash' in notification && !!notification.puzzleHash;
  const navigate = useNavigate();
  const location = useLocation();

  function handleClick() {
    onClick?.();

    if (offer && offer.summary) {
      navigate('/dashboard/offers/view', {
        state: {
          referrerPath: location.pathname,
          offerData: offer.data,
          offerSummary: offer.summary,
          imported: true,
          canCounterOffer,
          address: 'puzzleHash' in notification ? notification.puzzleHash : undefined,
        },
      });
    }
  }

  if ((isLoading && !offer) || (offer && !offer.valid)) {
    return null;
  }

  return (
    <NotificationWrapper
      onClick={handleClick}
      icon={
        <NotificationPreview
          notification={notification}
          fallback={<OffersIcon sx={{ fontSize: '32px !important' }} />}
        />
      }
      error={error}
      isLoading={isLoading}
    >
      <Flex flexDirection="column">
        <Typography variant="subtitle2" color="textSecondary">
          <Trans>You have a new offer</Trans>
          {' · '}
          <HumanTimestamp value={timestamp} fromNow />
        </Typography>
        <Typography variant="body2">
          <OfferDetails id={offerURLOrData} />
          <OfferDetails id={offerURLOrData} color="primary" requested />
        </Typography>
      </Flex>
    </NotificationWrapper>
  );
}

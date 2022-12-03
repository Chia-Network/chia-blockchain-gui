import { Card } from '@chia/core';
import { Trans } from '@lingui/macro';
import React from 'react';

import OfferNotifications from './OfferNotifications';

export type OfferNotificationsCardProps = {
  nftId?: string;
};

export default function OfferNotificationsCard(props: OfferNotificationsCardProps) {
  const { nftId } = props;

  return (
    <Card title={<Trans>Incoming Offers</Trans>} titleVariant="h6" transparent>
      <OfferNotifications nftId={nftId} />
    </Card>
  );
}

import { Flex } from '@chia-network/core';
import { Offers as OffersIcon } from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { MenuItem, Typography } from '@mui/material';
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import HeightToTimestamp from '../helpers/HeightToTimestamp';
import OfferAsset from '../offers/OfferAsset';
import NotificationNFTTitle from './NotificationNFTTitle';
import NotificationPreview from './NotificationPreview';

export type NotificationProps = {
  notification: {
    id: string;
    message: string;
  };
  onClick?: () => void;
};

export default function Notification(props: NotificationProps) {
  const {
    notification: { offer, offerSummary, offerData, error, offered, requested, height },
    onClick,
  } = props;
  const navigate = useNavigate();
  const location = useLocation();

  function handleClick() {
    onClick?.();

    if (offerSummary) {
      navigate('/dashboard/offers/view', {
        state: {
          referrerPath: location.pathname,
          offerData,
          offerSummary,
          imported: true,
        },
      });
    }
  }

  return (
    <MenuItem onClick={handleClick}>
      <Flex alignItems="flex-start" gap={2}>
        <NotificationPreview offer={offer} fallback={<OffersIcon sx={{ fontSize: 40 }} />} />
        {error ? (
          <Typography color="error">{error.message}</Typography>
        ) : (
          <Flex flexDirection="column">
            <Typography variant="body2" color="textSecondary">
              <Trans>You have a new offer</Trans>
              {' · '}
              <HeightToTimestamp height={height} fromNow />
            </Typography>
            {offered.map((info) => (
              <Flex flexDirection="row" gap={0.5} key={`${info.displayAmount}-${info.displayName}`}>
                {info.assetType === OfferAsset.NFT ? (
                  <NotificationNFTTitle nftId={info.displayName} />
                ) : (
                  <Typography noWrap>
                    {(info.displayAmount as any).toString()} {info.displayName}
                  </Typography>
                )}
              </Flex>
            ))}
            {requested.map((info) => (
              <Flex flexDirection="row" gap={0.5} key={`${info.displayAmount}-${info.displayName}`}>
                {info.assetType === OfferAsset.NFT ? (
                  <Typography color="primary" variant="body2" noWrap>
                    <NotificationNFTTitle nftId={info.displayName} />
                  </Typography>
                ) : (
                  <Typography color="primary" variant="body2" noWrap>
                    {(info.displayAmount as any).toString()} {info.displayName}
                  </Typography>
                )}
              </Flex>
            ))}
          </Flex>
        )}
      </Flex>
    </MenuItem>
  );
}

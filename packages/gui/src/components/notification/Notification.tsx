import { Flex, Loading } from '@chia/core';
import { Trans } from '@lingui/macro';
import { MenuItem, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import useAssetIdName from '../../hooks/useAssetIdName';
import useOffer from '../../hooks/useOffer';
import OfferAsset from '../offers/OfferAsset';
import { resolveOfferInfo } from '../offers/OfferManager';
import NotificationNFTTitle from './NotificationNFTTitle';
import NotificationPreview from './NotificationPreview';

export type NotificationProps = {
  notification: {
    id: number;
    message: string;
  };
  onClick?: () => void;
};

export default function Notification(props: NotificationProps) {
  const { notification, onClick } = props;
  const { isLoading, error, offer, offerSummary, offerData } = useOffer(notification.message);
  const { lookupByAssetId } = useAssetIdName();
  const navigate = useNavigate();
  const location = useLocation();

  const offered = useMemo(() => {
    if (offerSummary) {
      return resolveOfferInfo(offerSummary, 'offered', lookupByAssetId);
    }

    return [];
  }, [offerSummary, lookupByAssetId]);

  const requested = useMemo(() => {
    if (offerSummary) {
      return resolveOfferInfo(offerSummary, 'requested', lookupByAssetId);
    }

    return [];
  }, [offerSummary, lookupByAssetId]);

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
        <Flex alignItems="center" gap={1}>
          <NotificationPreview offer={offer} loading={isLoading} />
        </Flex>
        {isLoading ? (
          <Loading center size={14} />
        ) : error ? (
          <Typography color="error">{error.message}</Typography>
        ) : (
          <Flex flexDirection="column">
            <Typography variant="body2" color="textSecondary">
              <Trans>You have a new offer</Trans>
            </Typography>
            {offered.map((info, index) => (
              <Flex flexDirection="row" gap={0.5} key={`${index}-${info.displayName}`}>
                {info.assetType === OfferAsset.NFT ? (
                  <NotificationNFTTitle nftId={info.displayName} />
                ) : (
                  <Typography noWrap>
                    {(info.displayAmount as any).toString()} {info.displayName}
                  </Typography>
                )}
              </Flex>
            ))}
            {requested.map((info, index) => (
              <Flex flexDirection="row" gap={0.5} key={`${index}-${info.displayName}`}>
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

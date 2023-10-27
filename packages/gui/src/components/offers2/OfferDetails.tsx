import { Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography, type TypographyProps } from '@mui/material';
import React, { useMemo } from 'react';

import useOfferInfo from '../../hooks/useOfferInfo';
import NFTTitle from '../nfts/NFTTitle';
import OfferAsset from '../offers/OfferAsset';

export type OfferDetailsProps = {
  id: string;
  requested?: boolean;
  titleColor?: TypographyProps['color'];
  color?: TypographyProps['color'];
  forcePlainText?: boolean;
};

export default function OfferDetails(props: OfferDetailsProps) {
  const { id, requested = false, titleColor, color, forcePlainText } = props;

  const { data, isLoading, error } = useOfferInfo(id);

  const infos = useMemo(() => {
    if (!data) {
      return [];
    }

    if (requested && data.requested) {
      return data.requested;
    }

    return data.offered;
  }, [data, requested]);

  if (forcePlainText) {
    return isLoading ? (
      <Trans>Loading...</Trans>
    ) : error ? (
      <Trans>Error</Trans>
    ) : infos ? (
      infos.map((info) => (
        <>
          {info.assetType === OfferAsset.NFT ? (
            <NFTTitle nftId={info.displayName} />
          ) : (
            <>
              {(info.displayAmount as any).toString()} {info.displayName}
            </>
          )}
        </>
      ))
    ) : null;
  }
  return (
    <>
      {isLoading ? (
        <Typography color={color} variant="body2">
          <Trans>Loading...</Trans>
        </Typography>
      ) : error ? (
        <Typography color={color} variant="body2">
          <Trans>Error</Trans>
        </Typography>
      ) : infos ? (
        infos.map((info) => (
          <Flex flexDirection="row" gap={0.5} key={`${info.displayAmount}-${info.displayName}`}>
            {info.assetType === OfferAsset.NFT ? (
              <Typography color={titleColor} variant="body2" noWrap>
                <NFTTitle nftId={info.displayName} />
              </Typography>
            ) : (
              <Typography color={color} variant="body2" noWrap>
                {(info.displayAmount as any).toString()} {info.displayName}
              </Typography>
            )}
          </Flex>
        ))
      ) : null}
    </>
  );
}

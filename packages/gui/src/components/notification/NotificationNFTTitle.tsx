import { useGetNFTInfoQuery } from '@chia/api-react';
import { Trans } from '@lingui/macro';
import React from 'react';

import { launcherIdFromNFTId } from '../../util/nfts';
import NFTTitle from '../nfts/NFTTitle';

export type NotificationNFTTitleProps = {
  nftId: string;
};

export default function NotificationNFTTitle(props: NotificationNFTTitleProps) {
  const { nftId } = props;

  const launcherId = launcherIdFromNFTId(nftId);

  const {
    data: nft,
    isLoading,
    error,
  } = useGetNFTInfoQuery({
    coinId: launcherId ?? '',
  });

  if (isLoading) {
    return <Trans>Loading...</Trans>;
  }

  if (error) {
    return <Trans>Something went wrong</Trans>;
  }

  return <NFTTitle nft={nft} />;
}

import { useGetNFTInfoQuery } from '@chia-network/api-react';
import { Loading } from '@chia-network/core';
import { Error as ErrorIcon } from '@mui/icons-material';
import React from 'react';

import { launcherIdFromNFTId } from '../../util/nfts';
import NFTPreview from '../nfts/NFTPreview';

export type NotificationPreviewNFTProps = {
  nftId: string;
  size?: number;
};

export default function NotificationPreviewNFT(props: NotificationPreviewNFTProps) {
  const { nftId, size = 40 } = props;

  const launcherId = launcherIdFromNFTId(nftId);

  const {
    data: nft,
    isLoading,
    error,
  } = useGetNFTInfoQuery({
    coinId: launcherId ?? '',
  });

  if (isLoading) {
    return <Loading size={size} />;
  }

  if (error) {
    return <ErrorIcon height={size} color="error" />;
  }

  return <NFTPreview nft={nft} height={size} width={size} preview isCompact />;
}

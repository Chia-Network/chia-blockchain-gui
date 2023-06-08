import { Loading } from '@chia-network/core';
import { Error as ErrorIcon } from '@mui/icons-material';
import React from 'react';

import useNFT from '../../hooks/useNFT';
import { launcherIdFromNFTId } from '../../util/nfts';
import NFTPreview from '../nfts/NFTPreview';

export type NotificationPreviewNFTProps = {
  nftId: string;
  size?: number;
};

export default function NotificationPreviewNFT(props: NotificationPreviewNFTProps) {
  const { nftId, size = 40 } = props;

  const launcherId = launcherIdFromNFTId(nftId);

  const { nft, isLoading, error } = useNFT(launcherId);

  if (isLoading) {
    return <Loading size={size} />;
  }

  if (error) {
    return <ErrorIcon height={size} color="error" />;
  }

  if (!nft) {
    return null;
  }

  return <NFTPreview id={nft.launcherId} width={size} preview isCompact />;
}

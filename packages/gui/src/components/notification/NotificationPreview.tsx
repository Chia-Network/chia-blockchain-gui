import { Loading } from '@chia/core';
import React from 'react';

import NotificationPreviewNFT from './NotificationPreviewNFT';

export type NotificationPreviewProps = {
  offer?: any;
  loading?: boolean;
  size?: number;
};

export default function NotificationPreview(props: NotificationPreviewProps) {
  const { offer, loading = false, size = 40 } = props;

  if (loading) {
    return <Loading size={size} />;
  }

  const [nft] = offer?.offered.nfts ?? [];

  if (nft) {
    return <NotificationPreviewNFT nftId={nft.nftId} size={size} />;
  }

  return null;
}

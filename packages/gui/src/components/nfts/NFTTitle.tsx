import { type NFTInfo } from '@chia-network/api';
import { Trans } from '@lingui/macro';
import React from 'react';

import useNFTMetadata from '../../hooks/useNFTMetadata';

export type NFTTitleProps = {
  nft: NFTInfo;
};

export default function NFTTitle(props: NFTTitleProps) {
  const { nft } = props;
  const { metadata, isLoading } = useNFTMetadata(nft.$nftId);

  if (isLoading) {
    return <Trans>Loading...</Trans>;
  }

  return metadata?.name ?? <Trans>Title Not Available</Trans>;
}

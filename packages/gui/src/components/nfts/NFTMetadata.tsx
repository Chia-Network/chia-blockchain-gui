import { Trans } from '@lingui/macro';
import { get } from 'lodash';
import React, { type ReactNode } from 'react';

import useNFTMetadata from '../../hooks/useNFTMetadata';
import Highlight from '../helpers/Highlight';

export type NFTMetadataProps = {
  nftId: string;
  path: string;
  children?: ReactNode;
  loading?: ReactNode;
  highlight?: string;
};

export default function NFTMetadata(props: NFTMetadataProps) {
  const {
    nftId,
    path,
    loading = <Trans>Loading...</Trans>,
    children = <Trans>Not Available</Trans>,
    highlight,
  } = props;
  const { metadata, isLoading } = useNFTMetadata(nftId);

  if (isLoading) {
    return loading;
  }

  const value = get(metadata, path);
  if (highlight && value !== undefined && value !== null) {
    return <Highlight value={value} search={highlight} />;
  }

  return value ?? children;
}

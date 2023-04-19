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
  error?: ReactNode;
  highlight?: string;
};

export default function NFTMetadata(props: NFTMetadataProps) {
  const {
    nftId,
    path,
    loading = <Trans>Loading...</Trans>,
    children = <Trans>Not Available</Trans>,
    error: ErrorComponent,
    highlight,
  } = props;
  const { metadata, isLoading, error } = useNFTMetadata(nftId);

  if (isLoading) {
    return loading;
  }

  if (error && ErrorComponent) {
    return <ErrorComponent error={error} />;
  }

  const value = metadata && get(metadata, path);
  if (highlight && value !== undefined && value !== null) {
    return <Highlight value={value} search={highlight} />;
  }

  return value ?? children;
}

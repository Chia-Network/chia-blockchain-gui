import { Trans } from '@lingui/macro';
import React from 'react';

import NFTMetadata, { type NFTMetadataProps } from './NFTMetadata';

export type NFTTitleProps = Omit<NFTMetadataProps, 'path'>;

export default function NFTTitle(props: NFTTitleProps) {
  return (
    <NFTMetadata path="name" {...props}>
      <Trans>Title Not Available</Trans>
    </NFTMetadata>
  );
}

import { Box } from '@mui/material';
import React, { useRef } from 'react';

import NFTCard, { type NFTCardProps } from './NFTCard';

export type NFTCardLazyProps = NFTCardProps & {
  minHeight?: number;
};

export default function NFTCardLazy(props: NFTCardLazyProps) {
  const { ...rest } = props;
  const cardRef = useRef();

  return (
    <Box ref={cardRef}>
      <NFTCard {...rest} />
    </Box>
  );
}

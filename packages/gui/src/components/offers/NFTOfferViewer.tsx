import React from 'react';
import { Trans } from '@lingui/macro';
import { Back, Flex } from '@chia/core';
import { Grid } from '@mui/material';
import OfferHeader from './OfferHeader';

/* ========================================================================== */
/*                          NFT Offer Viewer Content                          */
/* ========================================================================== */

type NFTOfferDetailsProps = {};

function NFTOfferDetails(props: NFTOfferDetailsProps) {
  const {} = props;

  return (
    <Flex flexDirection="column" flexGrow={1} gap={4}>
      <OfferHeader isMyOffer={true} isInvalid={false} isComplete={false} />

      <Flex
        flexDirection="column"
        flexGrow={1}
        gap={1}
        style={{
          border: '1px solid #E0E0E0',
          boxSizing: 'border-box',
          borderRadius: '8px',
        }}
      >
        <div>test</div>
      </Flex>
    </Flex>
  );
}

/* ========================================================================== */
/*                              NFT Offer Viewer                              */
/* ========================================================================== */

type NFTOfferViewerProps = {};

export default function NFTOfferViewer(props: NFTOfferViewerProps) {
  const {} = props;

  return (
    <Grid container>
      <Flex flexDirection="column" flexGrow={1} gap={3}>
        <Flex>
          <Back variant="h5">
            <Trans>Viewing Offer</Trans>
          </Back>
        </Flex>
        <NFTOfferDetails />
      </Flex>
    </Grid>
  );
}

import React from 'react';
import { Trans } from '@lingui/macro';
import { Back, Flex } from '@chia/core';
import { Divider, Grid, Typography } from '@mui/material';
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
        <Flex flexDirection="column" gap={3} style={{ padding: '1em' }}>
          <Typography variant="h6" style={{ fontWeight: 'bold' }}>
            <Trans>Purchase Summary</Trans>
          </Typography>
          <Flex flexDirection="column" gap={2}>
            <Typography variant="body1">
              <Trans>You will receive</Trans>
            </Typography>
            <Flex flexDirection="column" gap={1}>
              <Typography variant="h5">NFT Title</Typography>
              <Typography variant="body2">By NFT Creator Title</Typography>
              <Typography variant="caption" color="textSecondary">
                nft17aadeznq3hwxtwhwq6xpj0pxy7dakdxzwmqgqsrydeszgvsdke9qcyu0c7
              </Typography>
            </Flex>
          </Flex>
          <Divider />
          <Flex flexDirection="column" gap={2}>
            <Typography variant="body1">
              <Trans>In exchange for</Trans>
            </Typography>
            <Typography variant="h5">300 XCH</Typography>
          </Flex>
          <Divider />
        </Flex>
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

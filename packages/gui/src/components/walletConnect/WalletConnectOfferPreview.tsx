import { Button, Flex, useOpenDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React from 'react';

import OfferBuilderViewerDialog from '../offers2/OfferBuilderViewerDialog';

export type WalletConnectOfferPreviewProps = {
  offer: string;
};

export default function WalletConnectOfferPreview(props: WalletConnectOfferPreviewProps) {
  const { offer } = props;
  const openDialog = useOpenDialog();

  function handleShowPreview() {
    openDialog(<OfferBuilderViewerDialog offer={offer} />);
  }

  // show offer value and button with offer details modal
  return (
    <Flex direction="column" gap={2}>
      <Typography noWrap>{offer}</Typography>
      <Flex>
        <Button variant="outlined" color="secondary" onClick={handleShowPreview}>
          <Trans>Show Offer Details</Trans>
        </Button>
      </Flex>
    </Flex>
  );
}

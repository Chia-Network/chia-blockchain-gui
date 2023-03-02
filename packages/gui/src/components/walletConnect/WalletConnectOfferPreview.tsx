import { Button, Flex, useOpenDialog, chiaToMojo } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import React from 'react';

import OfferBuilderViewerDialog from '../offers2/OfferBuilderViewerDialog';

export type WalletConnectOfferPreviewProps = {
  value: string;
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
};

function parseFee(value: any) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return '';
    }

    return value.toString();
  }

  if (value instanceof BigNumber) {
    if (value.isNaN()) {
      return '';
    }

    return value.toFixed();
  }

  return value;
}

export default function WalletConnectOfferPreview(props: WalletConnectOfferPreviewProps) {
  const { value: offer, values, onChange } = props;
  const openDialog = useOpenDialog();

  const fee = parseFee(values.fee);

  async function handleShowPreview() {
    const offerBuilderData = await openDialog(<OfferBuilderViewerDialog offer={offer} fee={fee} />);
    if (offerBuilderData) {
      // use new fee value
      const feeChia = offerBuilderData.offered.fee?.[0]?.amount;
      if (feeChia) {
        const feeMojos = feeChia ? chiaToMojo(feeChia).toFixed() : '0';
        onChange({
          ...values,
          fee: feeMojos,
        });
      }
    }
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

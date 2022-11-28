import { ConfirmDialog } from '@chia/core';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React from 'react';

/* ========================================================================== */
/*                      Offer Editor Confirmation Dialog                      */
/* ========================================================================== */

export default function OfferEditorConfirmationDialog(props) {
  const { ...rest } = props;

  return (
    <ConfirmDialog
      title={<Trans>Create Offer</Trans>}
      confirmTitle={<Trans>I Understand, Create Offer</Trans>}
      confirmColor="primary"
      cancelTitle={<Trans>Cancel</Trans>}
      {...rest}
    >
      <Typography>
        <Trans>
          When creating an offer, any assets that are being offered will be locked and unavailable until the offer is
          accepted or cancelled, resulting in your spendable balance changing.
        </Trans>
      </Typography>
    </ConfirmDialog>
  );
}

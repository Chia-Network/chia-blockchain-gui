import { Button, Flex, Loading, useOpenDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import React, { useMemo } from 'react';

import OfferBuilderData from '../../@types/OfferBuilderData';
import useAssetIdName from '../../hooks/useAssetIdName';
import createOfferForIdsToOfferBuilderData from '../../util/createOfferForIdsToOfferBuilderData';
import OfferBuilderViewerDialog from '../offers2/OfferBuilderViewerDialog';

export default function WalletConnectCreateOfferPreview({ value }: { value: Record<string, number> }) {
  const { lookupByWalletId, isLoading: isLoadingAssetIdNames } = useAssetIdName();
  const openDialog = useOpenDialog();

  const offerBuilderData: OfferBuilderData | undefined = useMemo(() => {
    if (isLoadingAssetIdNames) {
      return undefined;
    }

    return createOfferForIdsToOfferBuilderData(value, lookupByWalletId);
  }, [value, lookupByWalletId, isLoadingAssetIdNames]);

  async function handleShowPreview() {
    await openDialog(<OfferBuilderViewerDialog offerBuilderData={offerBuilderData} />);
  }

  return (
    <Flex flexDirection="column" gap={2}>
      {isLoadingAssetIdNames ? (
        <Loading />
      ) : (
        <Flex>
          <Button variant="outlined" color="secondary" onClick={handleShowPreview}>
            <Trans>Show Offer Details</Trans>
          </Button>
        </Flex>
      )}
    </Flex>
  );
}

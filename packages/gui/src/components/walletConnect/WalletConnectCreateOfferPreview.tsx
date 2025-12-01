import { Button, Flex, Loading, useOpenDialog, chiaToMojo } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import React, { useMemo } from 'react';

import OfferBuilderData from '../../@types/OfferBuilderData';
import useAssetIdName from '../../hooks/useAssetIdName';
import createOfferForIdsToOfferBuilderData from '../../util/createOfferForIdsToOfferBuilderData';
import parseFee from '../../util/parseFee';
import OfferBuilderViewerDialog from '../offers2/OfferBuilderViewerDialog';

export type WalletConnectOfferPreviewProps = {
  value: Record<string, number>;
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
};

export default function WalletConnectCreateOfferPreview(props: WalletConnectOfferPreviewProps) {
  const { value, values, onChange } = props;
  const { lookupByWalletId, isLoading: isLoadingAssetIdNames } = useAssetIdName();
  const openDialog = useOpenDialog();

  const fee = parseFee(values.fee);
  const driverDict = values.driverDict as Record<string, any> | undefined;

  const offerBuilderData: OfferBuilderData | undefined = useMemo(() => {
    if (isLoadingAssetIdNames) {
      return undefined;
    }

    return createOfferForIdsToOfferBuilderData(value, lookupByWalletId, fee, driverDict);
  }, [value, lookupByWalletId, isLoadingAssetIdNames, fee, driverDict]);

  async function handleShowPreview() {
    const offerBuilderDataResult = await openDialog(<OfferBuilderViewerDialog offerBuilderData={offerBuilderData} />);
    if (offerBuilderDataResult) {
      // use new fee value
      const feeChia = offerBuilderDataResult.offered.fee?.[0]?.amount;
      if (feeChia) {
        const feeMojos = feeChia ? chiaToMojo(feeChia).toFixed() : '0';
        onChange({
          ...values,
          fee: feeMojos,
        });
      }
    }
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

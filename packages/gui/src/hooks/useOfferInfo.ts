import { useMemo } from 'react';

import resolveOfferInfo from '../util/resolveOfferInfo';
import useAssetIdName from './useAssetIdName';
import useOffer from './useOffer';

export default function useOfferInfo(offerURLOrData: string) {
  const { offer, isLoading: isLoadingOffer, error: errorOffer } = useOffer(offerURLOrData);
  const { lookupByAssetId, isLoading: isLoadingAssetIdName, error: errorAssetId } = useAssetIdName();

  const isLoading = isLoadingOffer || isLoadingAssetIdName;
  const error = errorOffer || errorAssetId;

  const data = useMemo(() => {
    if (!offer || !offer.summary) {
      return null;
    }

    return {
      offered: resolveOfferInfo(offer.summary, 'offered', lookupByAssetId),
      requested: resolveOfferInfo(offer.summary, 'requested', lookupByAssetId),
    };
  }, [offer, lookupByAssetId]);

  return {
    data,
    isLoading,
    error,
  };
}

import { useContext, useState, useCallback, useEffect, useMemo } from 'react';

import { OffersContext } from '../components/offers2/OffersProvider';

export default function useOffer(offerURLOrData: string | undefined) {
  const context = useContext(OffersContext);
  if (!context) {
    throw new Error('useOffer must be used within OffersProvider');
  }

  const { invalidate, getOffer, subscribeToChanges } = context;

  const handleInvalidate = useCallback(() => invalidate(offerURLOrData), [invalidate, offerURLOrData]);
  const [offerState, setOfferState] = useState(() => getOffer(offerURLOrData));

  useMemo(() => {
    setOfferState(getOffer(offerURLOrData));
  }, [offerURLOrData, getOffer]);

  useEffect(
    () =>
      subscribeToChanges(offerURLOrData, (newOfferState) => {
        setOfferState(newOfferState);
      }),
    [offerURLOrData, subscribeToChanges]
  );

  return {
    ...offerState,
    invalidate: handleInvalidate,
  };
}

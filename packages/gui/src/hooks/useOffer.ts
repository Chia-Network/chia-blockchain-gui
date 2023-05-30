import { useState, useCallback, useEffect, useMemo } from 'react';

import useOffers from './useOffers';

export default function useOffer(offerURLOrData: string | undefined) {
  const { invalidate, getOffer, subscribeToChanges } = useOffers();

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

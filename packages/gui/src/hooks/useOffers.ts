import { useContext } from 'react';

import { OffersContext } from '../components/offers2/OffersProvider';

export default function useOffers() {
  const context = useContext(OffersContext);
  if (!context) {
    throw new Error('useOffer must be used within OffersProvider');
  }

  return context;
}

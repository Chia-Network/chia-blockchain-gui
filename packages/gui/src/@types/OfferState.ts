import type Offer from './Offer';

type OfferState = {
  offer: Offer | undefined;
  isLoading: boolean;
  error: Error | undefined;
};

export default OfferState;

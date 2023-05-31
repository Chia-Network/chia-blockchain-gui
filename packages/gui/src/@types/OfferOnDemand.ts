import type Offer from './Offer';

type OfferOnDemand = {
  offer?: Offer;
  error?: Error;
  promise?: Promise<Offer>;
};

export default OfferOnDemand;

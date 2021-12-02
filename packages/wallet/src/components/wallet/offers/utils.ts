import moment from 'moment';

type OfferEntry = {
  [key: string]: string;
};

type OfferSummary = {
  offered: OfferEntry;
  requested: OfferEntry;
};

export function suggestedFilenameForOffer(offer: OfferSummary): string {
  const date = moment().format('YYYY-MM-DD');
  return `Offer-${date}.offer`;
}
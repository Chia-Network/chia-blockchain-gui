type OfferEntry = {
  [key: string]: string;
};

type OfferSummary = {
  offered: OfferEntry;
  requested: OfferEntry;
};

var filenameCounter = 0;

export function suggestedFilenameForOffer(offer: OfferSummary): string {
  const filename = filenameCounter === 0 ? 'Untitled Offer.offer' : `Untitled Offer ${filenameCounter}.offer`;
  filenameCounter++;
  return filename;
}
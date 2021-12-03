import {
  mojo_to_chia_string,
  mojo_to_colouredcoin_string,
} from '../../../util/chia';

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

export function formatOfferEntry(assetId: string, amount: string | number): string {
  let amountString = '';
  if (assetId === 'xch') {
    amountString = `${mojo_to_chia_string(amount)} XCH`;
  }
  else {
    amountString = `${mojo_to_colouredcoin_string(amount)} CAT`;
  }
  return amountString;
}
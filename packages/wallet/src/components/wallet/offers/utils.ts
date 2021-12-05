import FormatLargeNumber from '@chia/core';
import WalletType from '../../../constants/WalletType';
import {
  chia_formatter,
  mojo_to_chia_string,
  mojo_to_colouredcoin_string,
} from '../../../util/chia';
import OfferState from './OfferState';

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

export function displayStringForOfferState(state: OfferState): string {
  switch (state) {
    case OfferState.PENDING_ACCEPT:
      return 'Pending Accept';
    case OfferState.PENDING_CONFIRM:
      return 'Pending Confirm';
    case OfferState.PENDING_CANCEL:
      return 'Pending Cancel';
    case OfferState.CANCELLED:
      return 'Cancelled';
    case OfferState.CONFIRMED:
      return 'Confirmed';
    case OfferState.FAILED:
      return 'Failed';
    default:
      return 'Unknown';
  }
}

export function colorForOfferState(state: OfferState): string {
  switch (state) {
    case OfferState.PENDING_ACCEPT:
      return 'secondary';
    case OfferState.PENDING_CONFIRM:
      return 'secondary';
    case OfferState.PENDING_CANCEL:
      return 'secondary';
    case OfferState.CANCELLED:
      return 'default';
    case OfferState.CONFIRMED:
      return 'primary';
    case OfferState.FAILED:
      return 'error';
    default:
      return 'default';
  }
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

export function formatAmountForWalletType(amount: string | number, walletType: WalletType): string {
  let amountString = '';
  if (walletType === WalletType.STANDARD_WALLET) {
    amountString = mojo_to_chia_string(amount);
  }
  else if (walletType === WalletType.CAT) {
    amountString = mojo_to_colouredcoin_string(amount);
  }
  else {
    amountString = `${amount}`;
  }
  return amountString;
}

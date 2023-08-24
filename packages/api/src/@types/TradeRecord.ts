import type BigNumber from 'bignumber.js';

import OfferState from '../constants/OfferState';

import type OfferCoinOfInterest from './OfferCoinOfInterest';
import OfferSummaryRecord from './OfferSummaryRecord';

type TradeRecord = {
  acceptedAtTime: BigNumber | number | null;
  coinsOfInterest: OfferCoinOfInterest[];
  confirmedAtIndex: number;
  createdAtTime: BigNumber | number;
  isMyOffer: boolean;
  pending: { [key: string]: number };
  sent: number;
  sentTo: string[] | number[];
  status: OfferState;
  summary: OfferSummaryRecord;
  takenOffer: string | null;
  tradeId: string;
};

export default TradeRecord;

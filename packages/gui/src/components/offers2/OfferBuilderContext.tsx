import type { CalculateRoyaltiesResponse } from '@chia-network/api';
import { createContext } from 'react';

import OfferState from '../offers/OfferState';

export interface OfferBuilderContextData {
  readOnly: boolean;
  imported: boolean;
  isMyOffer: boolean;
  state?: OfferState;
  offeredUnknownCATs?: string[];
  requestedUnknownCATs?: string[];
  usedAssetIds: string[];
  requestedRoyalties?: CalculateRoyaltiesResponse;
  offeredRoyalties?: CalculateRoyaltiesResponse;
  royalties?: CalculateRoyaltiesResponse;
  isCalculatingRoyalties: boolean;
}

const OfferBuilderContext = createContext<OfferBuilderContextData | undefined>(undefined);

export default OfferBuilderContext;

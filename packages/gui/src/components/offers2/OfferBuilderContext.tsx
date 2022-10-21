import { createContext } from 'react';
import type { CalculateRoyaltiesResponse } from '@chia/api';

export interface OfferBuilderContextData {
  readOnly: boolean;
  usedAssetIds: string[];
  royalties?: CalculateRoyaltiesResponse;
  isCalculatingRoyalties: boolean;
}

const OfferBuilderContext = createContext<OfferBuilderContextData | undefined>(
  undefined,
);

export default OfferBuilderContext;

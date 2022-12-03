import { usePrefs } from '@chia-network/api-react';

export type NFTImageFittingMode = 'contain' | 'cover' | 'fill';

export const defaultFittingMode: NFTImageFittingMode = 'cover';

export default function useNFTImageFittingMode(): [NFTImageFittingMode, (fittingMode: NFTImageFittingMode) => void] {
  return usePrefs<NFTImageFittingMode>('nftImageFittingMode', defaultFittingMode);
}

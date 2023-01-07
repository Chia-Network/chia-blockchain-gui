import type { NFTInfo } from '@chia-network/api';
import { useHiddenList } from '@chia-network/core';
import { useCallback } from 'react';

export default function useHiddenNFTs() {
  const [isNFTHidden, setIsNFTHidden, hiddenNFTs, setIsNFTMultipleHidden] = useHiddenList<NFTInfo['$nftId']>('nfts');

  const handleSetIsHidden = useCallback(
    (nft: NFTInfo, isHidden: boolean) => {
      setIsNFTHidden(nft.$nftId, isHidden);
    },
    [setIsNFTHidden]
  );

  const handleIsNFTHidden = useCallback((nft: NFTInfo) => isNFTHidden(nft?.$nftId), [isNFTHidden]);
  const setHiddenMultiple = useCallback(
    (nfts: NFTInfo[], hide: boolean) => {
      setIsNFTMultipleHidden(
        nfts.map((nft) => nft?.$nftId),
        hide
      );
    },
    [setIsNFTMultipleHidden]
  );

  return [handleIsNFTHidden, handleSetIsHidden, hiddenNFTs, setHiddenMultiple];
}

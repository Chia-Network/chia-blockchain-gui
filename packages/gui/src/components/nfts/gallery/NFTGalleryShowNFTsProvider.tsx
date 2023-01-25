import React, { createContext, useCallback, useMemo, useState } from 'react';

export interface NFTGalleryShowNFTsContextData {
  getVisibleNFTs: () => string[];
  setVisibleNFTs: (value: string[]) => void;
}

export const NFTGalleryShowNFTsContext = createContext<NFTGalleryShowNFTsContextData | undefined>(undefined);

export type NFTGalleryShowNFTsProps = {
  children?: React.ReactNode;
};

/*
  This context is used to store visible NFT ids (excluding filtered-out nfts!) that are shown in the gallery.
  The functions returned in the context are used to get and set visible NFTs after gallery loads all allowed 
  NFTs to be rendered in the gallery.
 */

export default function NFTGalleryShowNFTsProvider(props: NFTGalleryShowNFTsProps) {
  const { children } = props;

  const [visibleNFTs, setVisibleNFTs] = useState<string[]>([]);

  const getVisibleNFTs = useCallback(() => visibleNFTs, [visibleNFTs]);

  const value = useMemo(
    () => ({
      getVisibleNFTs,
      setVisibleNFTs,
    }),
    [getVisibleNFTs, setVisibleNFTs]
  );

  return <NFTGalleryShowNFTsContext.Provider value={value}>{children}</NFTGalleryShowNFTsContext.Provider>;
}

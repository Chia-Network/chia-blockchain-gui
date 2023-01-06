import React, { createContext, useCallback, useMemo, useState } from 'react';

export interface NFTGalleryScrollPositionContextData {
  getScrollPosition: () => number;
  setScrollPosition: (value: number) => void;
}

export const NFTGalleryScrollPositionContext = createContext<NFTGalleryScrollPositionContextData | undefined>(
  undefined
);

export type NFTGalleryScrollPositionProviderProps = {
  children?: React.ReactNode;
};

/*
  This context is used to store the scroll position of the NFT gallery.
  The functions returned in the context are used to get and set the
  scroll position.
 */

export default function NFTGalleryScrollPositionProvider(props: NFTGalleryScrollPositionProviderProps) {
  const { children } = props;

  const [scrollPosition, setScrollPosition] = useState(0);

  const getScrollPosition = useCallback(() => scrollPosition, [scrollPosition]);

  const value = useMemo(
    () => ({
      getScrollPosition,
      setScrollPosition,
    }),
    [getScrollPosition, setScrollPosition]
  );

  return <NFTGalleryScrollPositionContext.Provider value={value}>{children}</NFTGalleryScrollPositionContext.Provider>;
}

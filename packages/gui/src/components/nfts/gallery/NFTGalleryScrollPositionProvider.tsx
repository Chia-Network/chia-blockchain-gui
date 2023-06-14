import React, { createContext, useMemo, useState, type ReactNode } from 'react';

export interface NFTGalleryScrollPositionContextData {
  scrollPosition: number;
  setScrollPosition: (value: number) => void;
}

export const NFTGalleryScrollPositionContext = createContext<NFTGalleryScrollPositionContextData | undefined>(
  undefined
);

export type NFTGalleryScrollPositionProviderProps = {
  children?: ReactNode;
};

export default function NFTGalleryScrollPositionProvider(props: NFTGalleryScrollPositionProviderProps) {
  const { children } = props;

  const [scrollPosition, setScrollPosition] = useState(0);

  const context = useMemo(
    () => ({
      scrollPosition,
      setScrollPosition,
    }),
    [scrollPosition, setScrollPosition]
  );

  return (
    <NFTGalleryScrollPositionContext.Provider value={context}>{children}</NFTGalleryScrollPositionContext.Provider>
  );
}

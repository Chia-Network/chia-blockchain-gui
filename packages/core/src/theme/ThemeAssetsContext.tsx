import React, { createContext, useContext, type ReactNode } from 'react';

import type { ThemeAssets } from './themeAugmentation';

const ThemeAssetsContext = createContext<ThemeAssets | null>(null);

export type ThemeAssetsProviderProps = {
  assets: ThemeAssets;
  children: ReactNode;
};

export function ThemeAssetsProvider(props: ThemeAssetsProviderProps) {
  const { assets, children } = props;
  return <ThemeAssetsContext.Provider value={assets}>{children}</ThemeAssetsContext.Provider>;
}

export function useThemeAssets(): ThemeAssets {
  const assets = useContext(ThemeAssetsContext);
  if (!assets) {
    throw new Error('useThemeAssets must be used within ThemeAssetsProvider (wrap AppProviders in the GUI).');
  }
  return assets;
}

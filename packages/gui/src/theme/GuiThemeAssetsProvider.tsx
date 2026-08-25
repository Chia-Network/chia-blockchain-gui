import { ThemeAssetsProvider, useThemeVariant } from '@chia-network/core';
import React, { useMemo, type ReactNode } from 'react';

import { GUI_THEME_ASSETS } from './guiThemeAssets';

export type GuiThemeAssetsProviderProps = {
  children: ReactNode;
};

export default function GuiThemeAssetsProvider(props: GuiThemeAssetsProviderProps) {
  const { children } = props;
  const { themeVariant } = useThemeVariant();
  const assets = useMemo(() => GUI_THEME_ASSETS[themeVariant], [themeVariant]);

  return <ThemeAssetsProvider assets={assets}>{children}</ThemeAssetsProvider>;
}

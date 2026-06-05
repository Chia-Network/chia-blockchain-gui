import type { ElementType } from 'react';

import type { ThemeVariantId } from './variantTypes';

export type ThemeSvgComponent = ElementType;

export type ThemeAssets = {
  chiaCircle: ThemeSvgComponent;
  chiaWordmark: ThemeSvgComponent;
  chiaWordmarkBlack: ThemeSvgComponent;
  audioSmall: ThemeSvgComponent;
  documentSmall: ThemeSvgComponent;
  modelSmall: ThemeSvgComponent;
  unknownSmall: ThemeSvgComponent;
  videoSmall: ThemeSvgComponent;
  offerFileIcon: ThemeSvgComponent;
  walletConnectToChia: ThemeSvgComponent;
};

declare module '@mui/material/styles' {
  interface Theme {
    chiaTheme: {
      variant: ThemeVariantId;
    };
  }
  interface ThemeOptions {
    chiaTheme?: {
      variant: ThemeVariantId;
    };
  }

  interface Palette {
    sidebarSelectedFill?: { light?: string; dark?: string; main?: string };
    sidebarText?: { light?: string; dark?: string; main?: string };
  }

  interface PaletteOptions {
    sidebarSelectedFill?: { light?: string; dark?: string; main?: string };
    sidebarText?: { light?: string; dark?: string; main?: string };
  }
}

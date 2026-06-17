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

type ChiaPaletteColor = {
  main: string;
  light?: string;
  dark?: string;
  contrastText?: string;
};

type ChiaPaletteBorder = {
  main: string;
  dark: string;
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
    border: ChiaPaletteBorder;
    danger?: ChiaPaletteColor;
    highlight?: ChiaPaletteColor;
    sidebarSelectedFill?: { light?: string; dark?: string; main?: string };
    sidebarText?: { light?: string; dark?: string; main?: string };
  }

  interface PaletteOptions {
    border?: Partial<ChiaPaletteBorder>;
    danger?: ChiaPaletteColor;
    highlight?: ChiaPaletteColor;
    sidebarSelectedFill?: { light?: string; dark?: string; main?: string };
    sidebarText?: { light?: string; dark?: string; main?: string };
  }
}

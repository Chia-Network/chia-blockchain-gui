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

type ChiaSemanticPalette = {
  success?: string;
  warning?: string;
  error?: string;
  highlight?: string;
};

type ChiaSurfacePalette = {
  control?: string;
  tableHeader?: string;
  tableRowAlternate?: string;
  tableExpanded?: string;
  tableBorder?: string;
  /** App frame (header and sidebar) surface and its seam, when it differs from the page ground. */
  frame?: string;
  frameBorder?: string;
  /** Fill for hand-built inputs, matching the theme's text fields. */
  field?: string;
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
    semantic?: ChiaSemanticPalette;
    surfaces?: ChiaSurfacePalette;
    sidebarSelectedFill?: string | { light?: string; dark?: string; main?: string };
    sidebarText?: { light?: string; dark?: string; main?: string };
    /** When set, the current sidebar item gets an edge bar in this color instead of an outlined tile. */
    sidebarMarkCurrent?: string;
  }

  interface PaletteOptions {
    border?: Partial<ChiaPaletteBorder>;
    danger?: ChiaPaletteColor;
    highlight?: ChiaPaletteColor;
    semantic?: ChiaSemanticPalette;
    surfaces?: ChiaSurfacePalette;
    sidebarSelectedFill?: string | { light?: string; dark?: string; main?: string };
    sidebarText?: { light?: string; dark?: string; main?: string };
    sidebarMarkCurrent?: string;
  }

  interface TypeBackground {
    card: string;
  }
}

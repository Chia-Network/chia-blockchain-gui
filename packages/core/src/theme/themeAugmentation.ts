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
  /** Tinted section fill and its edge (offer builder headers, pending claw backs). */
  panel?: string;
  panelBorder?: string;
  /** Page behind the logged-out, loading and error screens. */
  hero?: string;
  /** File drop zones. */
  dropzone?: string;
  /** Log output. */
  console?: string;
  /** Numbered step markers. */
  stepIcon?: string;
  /** Popovers drawn by hand (the emoji and color picker). */
  raised?: string;
};

/**
 * Text and icon colors for spots that used fixed palette values. Themes that leave one unset keep that value, so
 * only the themes that define these change.
 */
type ChiaInkPalette = {
  /** Secondary icons, help icons and quiet labels. */
  muted?: string;
  /** Menu and popover text. */
  menu?: string;
  console?: string;
  onStepIcon?: string;
  /** State text and indicators (see `getStateColors`). */
  success?: string;
  warning?: string;
  error?: string;
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
    ink?: ChiaInkPalette;
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
    ink?: ChiaInkPalette;
    sidebarSelectedFill?: string | { light?: string; dark?: string; main?: string };
    sidebarText?: { light?: string; dark?: string; main?: string };
    sidebarMarkCurrent?: string;
  }

  interface TypeBackground {
    card: string;
  }
}

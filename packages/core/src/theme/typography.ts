import type { ThemeVariantId } from './variantTypes';

export type ThemeTypographyConfig = {
  fontFamily: string;
  headingFontFamily: string;
  /** Button labels; defaults to the heading font. */
  buttonFontFamily?: string;
  /** Display face for the page-title levels (h1–h5); h6 and subtitles keep the heading font. */
  displayFontFamily?: string;
  /** Addresses, hashes and IDs; exposed to components as the `--chia-font-mono` CSS variable. */
  monoFontFamily?: string;
  /** `font-variant-numeric` for amounts, exposed as the `--chia-numeric` CSS variable. */
  amountNumeric?: string;
};

/** Static typography per theme variant (chia.net brand: Barlow + Inter; retired 2024 Chia brand: Poppins + Inter). */
export const THEME_TYPOGRAPHY: Record<ThemeVariantId, ThemeTypographyConfig> = {
  classic: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    headingFontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  field: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    headingFontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  chia: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    headingFontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    buttonFontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    displayFontFamily: '"Barlow", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    monoFontFamily: '"JetBrains Mono", "Courier New", ui-monospace, monospace',
    amountNumeric: 'tabular-nums',
  },
  chia2024: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    headingFontFamily: '"Poppins", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
};

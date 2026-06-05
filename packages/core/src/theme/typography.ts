import type { ThemeVariantId } from './variantTypes';

export type ThemeTypographyConfig = {
  fontFamily: string;
  headingFontFamily: string;
};

/** Static typography per theme variant (Chia brand 2025: Poppins + Inter). */
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
    headingFontFamily: '"Poppins", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
};

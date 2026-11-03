import type { Theme } from '@mui/material/styles';

/**
 * Text roles for headings that use a heading level for size only. Page titles keep the display face; these use the
 * theme's heading face (the one `h6` uses), so only themes with a separate display face (Chia) look different.
 */

/** Card and section headings set at a page-title level. */
export const sectionTitleSx = {
  fontFamily: (theme: Theme) => theme.typography.h6.fontFamily,
};

/** Balances and other amounts: never the display face, and even-width digits where the theme asks for them. */
export const amountSx = {
  fontFamily: (theme: Theme) => theme.typography.h6.fontFamily,
  fontVariantNumeric: 'var(--chia-numeric, normal)',
};

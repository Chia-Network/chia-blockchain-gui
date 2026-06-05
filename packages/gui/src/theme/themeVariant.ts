/**
 * Electron-safe mirror of `packages/core/src/theme/variantTypes.ts`.
 * Do not import `@chia-network/core` from code used by `webpack.electron` — it bundles CSS.
 */
export const THEME_VARIANT_IDS = ['classic', 'field', 'chia'] as const;

export type ThemeVariantId = (typeof THEME_VARIANT_IDS)[number];

export const DEFAULT_THEME_VARIANT: ThemeVariantId = 'chia';

function isThemeVariantId(value: unknown): value is ThemeVariantId {
  return typeof value === 'string' && (THEME_VARIANT_IDS as readonly string[]).includes(value);
}

export function parseThemeVariantId(value: unknown, fallback: ThemeVariantId = DEFAULT_THEME_VARIANT): ThemeVariantId {
  return isThemeVariantId(value) ? value : fallback;
}

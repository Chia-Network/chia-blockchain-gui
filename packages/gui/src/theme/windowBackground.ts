import { DEFAULT_THEME_VARIANT, parseThemeVariantId, type ThemeVariantId } from './themeVariant';

/** First-paint background for windows and dialogs, before the renderer applies its theme. */
const WINDOW_BACKGROUNDS: Record<ThemeVariantId, { light: string; dark: string }> = {
  classic: { light: '#ffffff', dark: '#0f252a' },
  field: { light: '#ffffff', dark: '#0f252a' },
  chia: { light: '#f6f7f9', dark: '#0e1e3d' },
  chia2024: { light: '#ffffff', dark: '#0f252a' },
};

export function resolveWindowBackground(variant: unknown, isDarkMode: boolean): string {
  const backgrounds = WINDOW_BACKGROUNDS[parseThemeVariantId(variant, DEFAULT_THEME_VARIANT)];
  return isDarkMode ? backgrounds.dark : backgrounds.light;
}

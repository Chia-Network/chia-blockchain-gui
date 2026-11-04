import type { Theme } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

import { THEME_TYPOGRAPHY } from './typography';
import { type ThemeVariantId, DEFAULT_THEME_VARIANT, parseThemeVariantId } from './variantTypes';
import chiaDark from './variants/chia/dark';
import chiaLight from './variants/chia/light';
import chia2024Dark from './variants/chia2024/dark';
import chia2024Light from './variants/chia2024/light';
import classicDark from './variants/classic/dark';
import classicLight from './variants/classic/light';
import fieldDark from './variants/field/dark';
import fieldLight from './variants/field/light';

const THEMES: Record<ThemeVariantId, { light: Theme; dark: Theme }> = {
  classic: { light: classicLight, dark: classicDark },
  field: { light: fieldLight, dark: fieldDark },
  chia: { light: chiaLight, dark: chiaDark },
  chia2024: { light: chia2024Light, dark: chia2024Dark },
};

function withVariantOptions(base: Theme, variant: ThemeVariantId): Theme {
  const typography = THEME_TYPOGRAPHY[variant];
  const display = typography.displayFontFamily ?? typography.headingFontFamily;
  return createTheme(base, {
    chiaTheme: { variant },
    typography: {
      fontFamily: typography.fontFamily,
      h1: { fontFamily: display },
      h2: { fontFamily: display },
      h3: { fontFamily: display },
      h4: { fontFamily: display },
      h5: { fontFamily: display },
      h6: { fontFamily: typography.headingFontFamily },
      subtitle1: { fontFamily: typography.headingFontFamily },
      subtitle2: { fontFamily: typography.headingFontFamily },
      button: { fontFamily: typography.buttonFontFamily ?? typography.headingFontFamily },
    },
  });
}

export function resolveAppTheme(variant: ThemeVariantId, isDarkMode: boolean): Theme {
  const pair = THEMES[variant] ?? THEMES[DEFAULT_THEME_VARIANT];
  const base = isDarkMode ? pair.dark : pair.light;
  return withVariantOptions(base, variant);
}

export function resolveAppThemeFromPrefs(themeVariant: unknown, isDarkMode: boolean): Theme {
  return resolveAppTheme(parseThemeVariantId(themeVariant), isDarkMode);
}

export { DEFAULT_THEME_VARIANT, parseThemeVariantId };

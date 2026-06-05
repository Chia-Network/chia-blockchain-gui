import chiaChiaCircle from '../assets/theme/chia/chia_circle.svg';
import classicChiaCircle from '../assets/theme/classic/chia_circle.svg';
import fieldChiaCircle from '../assets/theme/field/chia_circle.svg';

import { DEFAULT_THEME_VARIANT, parseThemeVariantId, type ThemeVariantId } from './themeVariant';

const THEME_CIRCLE_ICONS: Record<ThemeVariantId, string> = {
  classic: classicChiaCircle as unknown as string,
  field: fieldChiaCircle as unknown as string,
  chia: chiaChiaCircle as unknown as string,
};

export function resolveThemeCircleIcon(variant: unknown): string {
  return THEME_CIRCLE_ICONS[parseThemeVariantId(variant, DEFAULT_THEME_VARIANT)];
}

import { usePrefs } from '@chia-network/api-react';
import { useCallback, useMemo } from 'react';

import { DEFAULT_THEME_VARIANT, parseThemeVariantId, type ThemeVariantId } from '../theme/variantTypes';

const PREFS_KEY = 'themeVariant';

export default function useThemeVariant(): {
  themeVariant: ThemeVariantId;
  setThemeVariant: (variant: ThemeVariantId) => void;
} {
  const [stored, setStored] = usePrefs<string>(PREFS_KEY, DEFAULT_THEME_VARIANT);

  const themeVariant = useMemo(() => parseThemeVariantId(stored), [stored]);

  const setThemeVariant = useCallback(
    (variant: ThemeVariantId) => {
      setStored(variant);
    },
    [setStored],
  );

  return { themeVariant, setThemeVariant };
}

import { Theme } from '@mui/material';
import { usePrefs } from '@chia-network/api-react';

export default function useWalletThemeColor(theme: Theme, variant?: string): string {
  const [themeColor] = usePrefs<string>('walletThemeColor', 'default');
  let fullColorName = themeColor;

  if (variant) {
    const upperVar = variant.charAt(0).toUpperCase() + variant.slice(1);
    fullColorName = themeColor + upperVar;
  }

  return theme.palette[fullColorName].main;
}

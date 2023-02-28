import { usePrefs } from '@chia-network/api-react';
import { Theme } from '@mui/material';

export default function useWalletThemeColor(theme: Theme, variant?: string): string {
  const [themeColor] = usePrefs<string>('walletThemeColor', 'default');
  return theme.palette.colors[themeColor || 'neutral'][variant || 'main'];
}

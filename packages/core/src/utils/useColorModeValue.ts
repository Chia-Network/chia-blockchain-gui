import { type Theme } from '@mui/material';

type PaletteKeys = keyof Theme['palette'];

export default function getColorModeValue(theme: Theme, color: PaletteKeys): string {
  const isDark = theme.palette.mode === 'dark';

  const value = isDark ? theme.palette[color].dark : theme.palette[color].light;

  return value ?? theme.palette[color].main;
}

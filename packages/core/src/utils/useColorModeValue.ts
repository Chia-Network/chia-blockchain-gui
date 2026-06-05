import { type Theme } from '@mui/material';

type PaletteKeys = keyof Theme['palette'];

type PaletteEntry = string | { light?: string; dark?: string; main?: string };

export default function getColorModeValue(theme: Theme, color: PaletteKeys): string {
  const entry = theme.palette[color] as PaletteEntry;

  if (typeof entry === 'string') {
    return entry;
  }

  if (!entry || typeof entry !== 'object') {
    return '';
  }

  const isDark = theme.palette.mode === 'dark';

  if (isDark) {
    return entry.dark ?? entry.main ?? '';
  }

  return entry.light ?? entry.main ?? '';
}

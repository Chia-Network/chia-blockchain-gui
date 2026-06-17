import { StateColor } from '@chia-network/core';
import type { Palette } from '@mui/material/styles';

export function getSemanticColors(palette: Palette) {
  return {
    success: palette.primary.main,
    warning: palette.warning?.main ?? palette.highlight?.main ?? StateColor.WARNING,
    error: palette.danger?.main ?? palette.error.main ?? StateColor.ERROR,
  };
}

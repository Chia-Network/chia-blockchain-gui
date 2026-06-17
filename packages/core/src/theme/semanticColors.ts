import type { Palette } from '@mui/material/styles';

import StateColor from '../constants/StateColor';

export function getSemanticColors(palette: Palette) {
  return {
    success: palette.primary.main,
    warning: palette.warning?.main ?? palette.highlight?.main ?? StateColor.WARNING,
    error: palette.danger?.main ?? palette.error.main ?? StateColor.ERROR,
  };
}

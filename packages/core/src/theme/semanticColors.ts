import type { Palette } from '@mui/material/styles';

import StateColor from '../constants/StateColor';

export function getSemanticColors(palette: Palette) {
  return {
    success: palette.semantic?.success ?? palette.primary.main,
    warning: palette.semantic?.warning ?? palette.warning?.main ?? StateColor.WARNING,
    error: palette.semantic?.error ?? palette.danger?.main ?? palette.error.main ?? StateColor.ERROR,
    highlight: palette.semantic?.highlight ?? palette.highlight?.main ?? palette.primary.main,
  };
}

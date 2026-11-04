import type { Palette, Theme } from '@mui/material/styles';

import StateColor from '../constants/StateColor';

export function getSemanticColors(palette: Palette) {
  return {
    success: palette.semantic?.success ?? palette.primary.main,
    warning: palette.semantic?.warning ?? palette.warning?.main ?? StateColor.WARNING,
    error: palette.semantic?.error ?? palette.danger?.main ?? palette.error.main ?? StateColor.ERROR,
    highlight: palette.semantic?.highlight ?? palette.highlight?.main ?? palette.primary.main,
  };
}

/**
 * Text and indicator colors for success, warning and error states. Themes that define `ink` state colors get
 * them; the others keep the fixed `StateColor` values they have always used.
 */
export function getStateColors(palette: Palette): { success: string; warning: string; error: string } {
  return {
    success: palette.ink?.success ?? String(StateColor.SUCCESS),
    warning: palette.ink?.warning ?? String(StateColor.WARNING),
    error: palette.ink?.error ?? String(StateColor.ERROR),
  };
}

/** `sx` for text in a state color, for components that take a color prop rather than a styled template. */
export const stateTextSx = {
  success: { color: (theme: Theme) => getStateColors(theme.palette).success },
  warning: { color: (theme: Theme) => getStateColors(theme.palette).warning },
  error: { color: (theme: Theme) => getStateColors(theme.palette).error },
};

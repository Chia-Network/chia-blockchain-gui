import type { Components, Theme } from '@mui/material/styles';

import type { ChiaNetModeTokens } from './brandColors';

const MONO_FONT_FAMILY = '"JetBrains Mono", "Courier New", ui-monospace, monospace';

/**
 * Component rules for the chia.net theme, shared by light and dark. Buttons: one blue primary per region, a
 * secondary with a fill and a 3:1 edge, ghost text buttons, neutral gray hovers. Fields, cards and menus follow the
 * same edge, hairline and radius rules.
 */
export default function getChiaNetComponents(t: ChiaNetModeTokens): Components<Omit<Theme, 'components'>> {
  const focusRing = {
    outline: `3px solid ${t.focus}`,
    outlineOffset: '2px',
  };

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: t.ground,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '*:focus-visible': focusRing,
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: t.tooltip,
          color: '#FAFBFC',
          borderRadius: 6,
        },
      },
    },
    MuiSvgIcon: {
      variants: [
        { props: { fontSize: 'extraLarge' }, style: { fontSize: '3rem' } },
        { props: { fontSize: 'sidebarIcon' }, style: { fontSize: '2rem' } },
        { props: { fontSize: 'notificationIcon' }, style: { fontSize: '5rem' } },
      ],
    },
    MuiTypography: {
      styleOverrides: {
        h1: { fontWeight: 600, lineHeight: 1.1 },
        h2: { fontWeight: 600, lineHeight: 1.1 },
        h3: { fontWeight: 600, lineHeight: 1.1 },
        h4: { fontWeight: 600, lineHeight: 1.15 },
        h5: { fontWeight: 600, lineHeight: 1.2 },
        h6: { fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.01em' },
        overline: {
          fontFamily: MONO_FONT_FAMILY,
          fontSize: '0.6875rem',
          fontWeight: 500,
          lineHeight: 16 / 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        },
      },
    },
    MuiChip: {
      variants: [
        {
          props: { size: 'extraSmall' },
          style: {
            height: '20px',
            fontSize: '0.75rem',
            '.MuiChip-label': { paddingLeft: '6px', paddingRight: '6px' },
          },
        },
      ],
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 500,
          textTransform: 'none',
          letterSpacing: 0,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
          '&.Mui-disabled': { opacity: 0.55 },
        },
        containedPrimary: {
          backgroundColor: t.primary,
          color: t.onPrimary,
          '&:hover': { backgroundColor: t.primaryHover },
        },
        // Every outlined button is a secondary: a fill, the 3:1 edge, text in the text color.
        outlined: {
          backgroundColor: t.secondaryFill,
          borderColor: t.edge,
          color: t.text,
          boxShadow: t.shadowLow,
          '&:hover': { backgroundColor: t.hover, borderColor: t.edge, boxShadow: t.shadowLow },
        },
        // Text buttons are ghosts: no fill or edge, hover to the secondary's resting gray.
        text: {
          color: t.text,
          '&:hover': { backgroundColor: t.hover },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: t.hover },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          color: t.text,
          borderColor: t.edge,
          '&:hover': { backgroundColor: t.hover },
          '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: t.selected, color: t.text },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          '&::placeholder': { color: t.muted, opacity: 1 },
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          backgroundColor: t.field,
          border: `1px solid ${t.edge}`,
          borderRadius: 6,
          '&:hover, &.Mui-focused': { backgroundColor: t.field },
          '&.Mui-focused': focusRing,
          '&.Mui-error': { borderColor: t.errorText },
          '&.Mui-disabled': { backgroundColor: t.hover },
          '&:before, &:after, &:hover:not(.Mui-disabled):before': { display: 'none' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: t.field,
          borderRadius: 6,
          '& .MuiOutlinedInput-notchedOutline, &:hover .MuiOutlinedInput-notchedOutline': { borderColor: t.edge },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: t.edge, borderWidth: 1 },
          '&.Mui-focused': focusRing,
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: t.errorText },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        // The current tab is a green underline, as on chia.net: a mark, not a fill.
        indicator: { backgroundColor: t.mark, height: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          color: t.muted,
          '&:hover': { color: t.text },
          '&.Mui-selected': { color: t.text },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    // Cards are flat: a hairline and the 6px radius, no shadow. Shadows stay with menus, dialogs and toasts.
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${t.hairline}`,
          borderRadius: 6,
          boxShadow: 'none',
          backgroundColor: t.card,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: 8, border: `1px solid ${t.hairline}`, boxShadow: t.shadowMid },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: { borderRadius: 8, boxShadow: t.shadowMid },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 8, backgroundColor: t.card, boxShadow: t.shadowHigh },
      },
    },
    // Table cells are data: even-width digits so columns line up.
    MuiTableCell: {
      styleOverrides: {
        body: { fontVariantNumeric: 'tabular-nums' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: t.hairline },
        bar: { backgroundColor: t.primary },
      },
    },
  };
}

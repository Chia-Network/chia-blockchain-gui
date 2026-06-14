import { alpha } from '@mui/material';
import { createTheme } from '@mui/material/styles';

import Color from '../../../constants/Color';

import theme from './default';

export default createTheme(
  {
    ...theme,
    palette: {
      ...theme.palette,
      background: {
        ...theme.palette.background,
        default: '#16130d',
        paper: '#211b12',
        card: alpha('#f7df9b', 0.08),
      },
      primary: {
        main: '#d8ad45',
        contrastText: '#16130d',
      },
      secondary: {
        ...theme.palette.secondary,
        main: '#f7efd8', // balance text, confirmation text in tx table
        contrastText: '#16130d',
      },
      highlight: {
        main: '#f7df9b',
      },
      warning: {
        main: Color.Orange[300],
        contrastText: '#16130d',
      },
      info: {
        ...theme.palette.info,
        main: '#cdbb91',
      },
      action: {
        ...theme.palette.action,
        hover: 'rgba(216, 173, 69, 0.16)',
        selected: 'rgba(216, 173, 69, 0.22)',
        focus: 'rgba(216, 173, 69, 0.22)',
      },
      text: {
        primary: 'rgba(247, 239, 216, 0.92)',
        secondary: 'rgba(247, 239, 216, 0.62)',
        disabled: Color.Text.Dark.Disabled,
      },
      border: {
        main: 'rgba(247, 223, 155, 0.16)',
        dark: 'rgba(247, 223, 155, 0.2)',
      },
      sidebarBackground: '#211d13',
      sidebarIconSelected: {
        main: '#f7df9b',
        dark: '#f7df9b',
      },
      sidebarIcon: {
        main: 'rgba(247, 239, 216, 0.58)',
        dark: 'rgba(247, 239, 216, 0.58)',
      },
      sidebarIconHover: {
        main: '#fff3cf',
        dark: '#fff3cf',
      },

      colors: {
        royal: {
          main: Color.Royal[300],
          border: Color.Royal[700],
          accent: Color.Royal[800],
        },
        grape: {
          main: Color.Grape[400],
          border: Color.Grape[700],
          accent: Color.Grape[800],
        },
        purple: {
          main: Color.Purple[300],
          border: Color.Purple[700],
          accent: Color.Purple[800],
        },
        red: {
          main: Color.Red[300],
          border: Color.Red[700],
          accent: Color.Red[800],
        },
        orange: {
          main: Color.Orange[300],
          border: Color.Orange[700],
          accent: Color.Orange[800],
        },
        yellow: {
          main: Color.Yellow[400],
          border: Color.Yellow[700],
          accent: Color.Yellow[800],
        },
        lime: {
          main: Color.Lime[400],
          border: Color.Lime[700],
          accent: Color.Lime[800],
        },
        green: {
          main: '#d8ad45',
          border: '#9b7040',
          accent: '#5c4329',
        },
        aqua: {
          main: Color.Aqua[300],
          border: Color.Aqua[700],
          accent: Color.Aqua[800],
        },
        blue: {
          main: Color.Blue[300],
          border: Color.Blue[700],
          accent: Color.Blue[800],
        },
        comet: {
          main: Color.Comet[500],
          border: Color.Comet[500],
          accent: Color.Comet[900],
        },
        storm: {
          main: Color.Storm[500],
          border: Color.Storm[700],
          accent: Color.Storm[900],
        },
        wine: {
          main: Color.Wine[500],
          border: Color.Wine[700],
          accent: Color.Wine[900],
        },
        cosmic: {
          main: Color.Cosmic[500],
          border: Color.Cosmic[700],
          accent: Color.Cosmic[900],
        },
        sand: {
          main: Color.Sand[500],
          border: Color.Sand[700],
          accent: Color.Sand[900],
        },
        husk: {
          main: Color.Husk[500],
          border: Color.Husk[700],
          accent: Color.Husk[900],
        },
        bean: {
          main: Color.Bean[500],
          border: Color.Bean[700],
          accent: Color.Bean[900],
        },
        forest: {
          main: Color.Forest[500],
          border: Color.Forest[700],
          accent: Color.Forest[900],
        },
        sea: {
          main: Color.Sea[500],
          border: Color.Sea[700],
          accent: Color.Sea[900],
        },
        glacier: {
          main: Color.Glacier[500],
          border: Color.Glacier[700],
          accent: Color.Glacier[900],
        },
        default: {
          main: '#3a3020',
          border: '#9b7040',
          accent: '#f7df9b',
          background: '#2a2418',
          backgroundBadge: '#2f291d',
          backgroundLight: '#211b12',
          text: '#e8d9b6',
        },
      },
      mode: 'dark',
    },
  },
  {
    components: {
      ...theme.components,
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: '#16130d',
            backgroundImage:
              'linear-gradient(118deg, rgba(22, 19, 13, 0.98) 0%, rgba(40, 31, 18, 0.96) 44%, rgba(27, 28, 20, 0.96) 100%), repeating-linear-gradient(102deg, rgba(216, 173, 69, 0.08) 0 18px, rgba(155, 112, 64, 0.08) 18px 34px, transparent 34px 68px)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            borderColor: 'rgba(247, 223, 155, 0.14)',
            backgroundColor: 'rgba(33, 27, 18, 0.86)',
            backgroundImage: 'linear-gradient(180deg, rgba(42, 36, 24, 0.92) 0%, rgba(31, 26, 17, 0.86) 100%)',
            boxShadow: '0 18px 54px rgba(0, 0, 0, 0.24)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            '&.MuiButton-text:not(.Mui-disabled):hover, &.MuiButton-outlined:not(.Mui-disabled):hover': {
              backgroundColor: 'rgba(216, 173, 69, 0.12)',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&:not(.Mui-disabled):hover': {
              backgroundColor: 'rgba(216, 173, 69, 0.14)',
              color: '#fff3cf',
            },
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            '&:not(.Mui-disabled):hover': {
              backgroundColor: 'rgba(216, 173, 69, 0.14)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(216, 173, 69, 0.18)',
            },
            '&.Mui-selected:hover': {
              backgroundColor: 'rgba(216, 173, 69, 0.22)',
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&:not(.Mui-disabled):hover': {
              backgroundColor: 'rgba(216, 173, 69, 0.14)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(216, 173, 69, 0.18)',
            },
            '&.Mui-selected:hover': {
              backgroundColor: 'rgba(216, 173, 69, 0.22)',
            },
          },
        },
      },
      MuiCardActionArea: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: 'rgba(216, 173, 69, 0.1)',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&.MuiTableRow-hover:hover': {
              backgroundColor: 'rgba(216, 173, 69, 0.12)',
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: 'rgba(216, 173, 69, 0.1)',
              color: '#fff3cf',
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(216, 173, 69, 0.2)',
          },
          bar: {
            backgroundColor: '#d8ad45',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: '#3a3020',
          },
        },
      },
    },
  },
);

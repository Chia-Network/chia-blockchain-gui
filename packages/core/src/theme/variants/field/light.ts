import { createTheme } from '@mui/material/styles';

import Color from '../../../constants/Color';

import theme from './default';

export default createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    background: {
      ...theme.palette.background,
      default: '#f4f0e5',
      card: '#fffaf0',
      paper: '#fffaf0',
    },
    primary: {
      main: '#b98524',
      contrastText: '#fffaf0',
    },
    secondary: {
      main: '#3c3424',
      contrastText: '#fffaf0',
    },
    highlight: {
      main: '#b98524',
    },
    warning: {
      main: '#b98524',
      contrastText: '#fffaf0',
    },
    info: {
      ...theme.palette.info,
      main: '#5c7882',
    },
    action: {
      ...theme.palette.action,
      hover: 'rgba(185, 133, 36, 0.12)',
      selected: 'rgba(185, 133, 36, 0.18)',
      focus: 'rgba(185, 133, 36, 0.18)',
    },
    text: {
      primary: 'rgba(36, 48, 36, 0.9)',
      secondary: 'rgba(36, 48, 36, 0.62)',
      disabled: Color.Text.Light.Disabled,
    },
    border: {
      main: 'rgba(71, 58, 36, 0.16)',
      dark: Color.Neutral[700],
    },
    sidebarBackground: '#302c1f',
    sidebarIconSelected: {
      main: '#f7df9b',
      dark: '#d8ad45',
    },
    sidebarIcon: {
      main: 'rgba(247, 239, 216, 0.68)',
      dark: Color.Neutral[400],
    },
    sidebarIconHover: {
      main: '#fff3cf',
      dark: Color.Neutral[50],
    },

    colors: {
      royal: {
        main: Color.Royal[200],
        border: Color.Royal[400],
        accent: Color.Royal[600],
      },
      grape: {
        main: Color.Grape[200],
        border: Color.Grape[400],
        accent: Color.Grape[600],
      },
      purple: {
        main: Color.Purple[200],
        border: Color.Purple[400],
        accent: Color.Purple[600],
      },
      red: {
        main: Color.Red[200],
        border: Color.Red[400],
        accent: Color.Red[600],
      },
      orange: {
        main: Color.Orange[200],
        border: Color.Orange[400],
        accent: Color.Orange[600],
      },
      yellow: {
        main: Color.Yellow[200],
        border: Color.Yellow[500],
        accent: Color.Yellow[600],
      },
      lime: {
        main: Color.Lime[200],
        border: Color.Lime[500],
        accent: Color.Lime[600],
      },
      green: {
        main: Color.Green[200],
        border: Color.Green[400],
        accent: Color.Green[600],
      },
      aqua: {
        main: Color.Aqua[200],
        border: Color.Aqua[400],
        accent: Color.Aqua[600],
      },
      blue: {
        main: Color.Blue[200],
        border: Color.Blue[400],
        accent: Color.Blue[600],
      },
      comet: {
        main: Color.Comet[300],
        border: Color.Comet[400],
        accent: Color.Comet[700],
      },
      storm: {
        main: Color.Storm[300],
        border: Color.Storm[400],
        accent: Color.Storm[700],
      },
      wine: {
        main: Color.Wine[300],
        border: Color.Wine[400],
        accent: Color.Wine[700],
      },
      cosmic: {
        main: Color.Cosmic[300],
        border: Color.Cosmic[400],
        accent: Color.Cosmic[700],
      },
      sand: {
        main: Color.Sand[300],
        border: Color.Sand[400],
        accent: Color.Sand[700],
      },
      husk: {
        main: Color.Husk[300],
        border: Color.Husk[400],
        accent: Color.Husk[700],
      },
      bean: {
        main: Color.Bean[300],
        border: Color.Bean[400],
        accent: Color.Bean[700],
      },
      forest: {
        main: Color.Forest[300],
        border: Color.Forest[400],
        accent: Color.Forest[700],
      },
      sea: {
        main: Color.Sea[300],
        border: Color.Sea[400],
        accent: Color.Sea[700],
      },
      glacier: {
        main: Color.Glacier[300],
        border: Color.Glacier[400],
        accent: Color.Glacier[700],
      },
      default: {
        main: Color.Neutral[300],
        border: Color.Neutral[400],
        accent: Color.Neutral[900],
        background: Color.Neutral[300],
        backgroundBadge: Color.Neutral[100],
        backgroundLight: Color.Neutral[50],
        text: Color.Neutral[600],
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    ...theme.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f4f0e5',
          backgroundImage:
            'linear-gradient(118deg, rgba(246, 241, 225, 0.98) 0%, rgba(236, 225, 195, 0.94) 42%, rgba(232, 229, 209, 0.94) 100%), repeating-linear-gradient(102deg, rgba(169, 121, 35, 0.1) 0 18px, rgba(205, 169, 79, 0.08) 18px 34px, transparent 34px 68px)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          borderColor: 'rgba(71, 58, 36, 0.14)',
          backgroundColor: 'rgba(255, 250, 240, 0.86)',
          backgroundImage: 'linear-gradient(180deg, rgba(255, 252, 244, 0.94) 0%, rgba(250, 244, 229, 0.82) 100%)',
          boxShadow: '0 18px 54px rgba(71, 58, 36, 0.1)',
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
            backgroundColor: 'rgba(185, 133, 36, 0.08)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:not(.Mui-disabled):hover': {
            backgroundColor: 'rgba(185, 133, 36, 0.1)',
            color: '#8f641d',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:not(.Mui-disabled):hover': {
            backgroundColor: 'rgba(185, 133, 36, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(185, 133, 36, 0.14)',
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'rgba(185, 133, 36, 0.18)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:not(.Mui-disabled):hover': {
            backgroundColor: 'rgba(185, 133, 36, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(185, 133, 36, 0.14)',
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'rgba(185, 133, 36, 0.18)',
          },
        },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(185, 133, 36, 0.08)',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': {
            backgroundColor: 'rgba(185, 133, 36, 0.08)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(185, 133, 36, 0.08)',
            color: '#8f641d',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(185, 133, 36, 0.2)',
        },
        bar: {
          backgroundColor: '#b98524',
        },
      },
    },
  },
});

import { alpha } from '@mui/material';
import { createTheme } from '@mui/material/styles';

import Color from '../constants/Color';
import theme from './default';

export default createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    background: {
      ...theme.palette.background,
      default: Color.Neutral[900],
      paper: Color.Neutral[900],
      card: alpha(Color.Neutral[50], 0.08),
    },
    secondary: {
      ...theme.palette.secondary,
      main: Color.Neutral[50], // balance text, confirmation text in tx table
      contrastText: Color.Neutral[900],
    },
    info: {
      ...theme.palette.info,
      main: Color.Neutral[400],
    },
    text: {
      primary: Color.Text.Dark.Primary,
      secondary: Color.Text.Dark.Secondary,
      disabled: Color.Text.Dark.Disabled,
    },
    sidebarBackground: theme.palette.sidebarBackground.dark,

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
        main: Color.Green[300],
        border: Color.Green[700],
        accent: Color.Green[800],
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
        main: Color.Neutral[600],
        border: Color.Neutral[600],
        accent: Color.Neutral[900],
        background: Color.Neutral[300],
        backgroundBadge: Color.Neutral[600],
        backgroundLight: Color.Neutral[700],
        text: Color.Neutral[200],
      },
    },
    mode: 'dark',
  },
});

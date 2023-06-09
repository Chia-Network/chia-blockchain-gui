import { createTheme } from '@mui/material/styles';

import Color from '../constants/Color';
import theme from './default';

export default createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    background: {
      ...theme.palette.background,
      default: '#212121',
      paper: '#333333',
      card: 'rgba(255, 255, 255, 0.08)',
    },
    secondary: {
      ...theme.palette.secondary,
      main: '#ffffff',
      contrastText: '#000000',
    },
    info: {
      ...theme.palette.info,
      main: '#fff',
    },
    sidebarBackground: theme.palette.sidebarBackground.dark,
    colors: {
      royal: {
        main: Color.Royal[100],
        border: Color.Royal[300],
        accent: Color.Royal[800],
      },
      grape: {
        main: Color.Grape[100],
        border: Color.Grape[300],
        accent: Color.Grape[800],
      },
      purple: {
        main: Color.Purple[100],
        border: Color.Purple[300],
        accent: Color.Purple[800],
      },
      red: {
        main: Color.Red[100],
        border: Color.Red[300],
        accent: Color.Red[800],
      },
      orange: {
        main: Color.Orange[100],
        border: Color.Orange[300],
        accent: Color.Orange[800],
      },
      yellow: {
        main: Color.Yellow[100],
        border: Color.Yellow[300],
        accent: Color.Yellow[800],
      },
      lime: {
        main: Color.Lime[100],
        border: Color.Lime[300],
        accent: Color.Lime[800],
      },
      green: {
        main: Color.Green[100],
        border: Color.Green[300],
        accent: Color.Green[800],
      },
      aqua: {
        main: Color.Aqua[100],
        border: Color.Aqua[300],
        accent: Color.Aqua[800],
      },
      blue: {
        main: Color.Blue[100],
        border: Color.Blue[300],
        accent: Color.Blue[800],
      },
      comet: {
        main: Color.Comet[200],
        border: Color.Comet[400],
        accent: Color.Comet[800],
      },
      storm: {
        main: Color.Storm[100],
        border: Color.Storm[300],
        accent: Color.Storm[800],
      },
      wine: {
        main: Color.Wine[100],
        border: Color.Wine[300],
        accent: Color.Wine[800],
      },
      cosmic: {
        main: Color.Cosmic[100],
        border: Color.Cosmic[300],
        accent: Color.Cosmic[800],
      },
      sand: {
        main: Color.Sand[100],
        border: Color.Sand[300],
        accent: Color.Sand[800],
      },
      husk: {
        main: Color.Husk[100],
        border: Color.Husk[300],
        accent: Color.Husk[800],
      },
      bean: {
        main: Color.Bean[100],
        border: Color.Bean[300],
        accent: Color.Bean[800],
      },
      forest: {
        main: Color.Forest[100],
        border: Color.Forest[300],
        accent: Color.Forest[800],
      },
      sea: {
        main: Color.Sea[100],
        border: Color.Sea[300],
        accent: Color.Sea[800],
      },
      glacier: {
        main: Color.Glacier[100],
        border: Color.Glacier[300],
        accent: Color.Glacier[800],
      },
      default: {
        main: Color.Neutral[100],
        border: Color.Neutral[300],
        accent: Color.Neutral[800],
        background: Color.Neutral[900],
        backgroundBadge: Color.Neutral[500],
        backgroundLight: Color.Neutral[700],
        text: Color.Neutral[200],
      },
    },
    mode: 'dark',
  },
});

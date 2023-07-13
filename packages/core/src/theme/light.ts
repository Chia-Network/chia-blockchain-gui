import { createTheme } from '@mui/material/styles';

import Color from '../constants/Color';
import theme from './default';

export default createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    background: {
      ...theme.palette.background,
      card: Color.Neutral[50],
      paper: Color.Neutral[50],
    },
    sidebarBackground: theme.palette.sidebarBackground.main,

    colors: {
      royal: {
        main: Color.Royal[200],
        border: Color.Royal[400],
        accent: Color.Royal[900],
      },
      grape: {
        main: Color.Grape[200],
        border: Color.Grape[400],
        accent: Color.Grape[900],
      },
      purple: {
        main: Color.Purple[200],
        border: Color.Purple[400],
        accent: Color.Purple[900],
      },
      red: {
        main: Color.Red[200],
        border: Color.Red[400],
        accent: Color.Red[900],
      },
      orange: {
        main: Color.Orange[200],
        border: Color.Orange[400],
        accent: Color.Orange[900],
      },
      yellow: {
        main: Color.Yellow[200],
        border: Color.Yellow[500],
        accent: Color.Yellow[900],
      },
      lime: {
        main: Color.Lime[300],
        border: Color.Lime[500],
        accent: Color.Lime[900],
      },
      green: {
        main: Color.Green[200],
        border: Color.Green[400],
        accent: Color.Green[900],
      },
      aqua: {
        main: Color.Aqua[200],
        border: Color.Aqua[400],
        accent: Color.Aqua[900],
      },
      blue: {
        main: Color.Blue[200],
        border: Color.Blue[400],
        accent: Color.Blue[900],
      },
      comet: {
        main: Color.Comet[200],
        border: Color.Comet[400],
        accent: Color.Comet[900],
      },
      storm: {
        main: Color.Storm[200],
        border: Color.Storm[400],
        accent: Color.Storm[900],
      },
      wine: {
        main: Color.Wine[200],
        border: Color.Wine[400],
        accent: Color.Wine[900],
      },
      cosmic: {
        main: Color.Cosmic[200],
        border: Color.Cosmic[400],
        accent: Color.Cosmic[900],
      },
      sand: {
        main: Color.Sand[200],
        border: Color.Sand[400],
        accent: Color.Sand[900],
      },
      husk: {
        main: Color.Husk[200],
        border: Color.Husk[400],
        accent: Color.Husk[900],
      },
      bean: {
        main: Color.Bean[200],
        border: Color.Bean[400],
        accent: Color.Bean[900],
      },
      forest: {
        main: Color.Forest[200],
        border: Color.Forest[400],
        accent: Color.Forest[900],
      },
      sea: {
        main: Color.Sea[200],
        border: Color.Sea[400],
        accent: Color.Sea[900],
      },
      glacier: {
        main: Color.Glacier[200],
        border: Color.Glacier[400],
        accent: Color.Glacier[900],
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
});

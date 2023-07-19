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
    text: {
      primary: Color.Text.Light.Primary,
      secondary: Color.Text.Light.Secondary,
      disabled: Color.Text.Light.Disabled,
    },
    sidebarBackground: theme.palette.sidebarBackground.main,

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
});

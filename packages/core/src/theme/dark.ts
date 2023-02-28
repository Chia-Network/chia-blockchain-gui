import { createTheme } from '@mui/material/styles';

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
    colors: {
      royal: {
        main: '#DCE6FD',
        accent: '#7EA9F8',
        dark: '#2333AA',
      },
      grape: {
        main: '#E6E7F9',
        accent: '#C3C3EE',
        dark: '#57478C',
      },
      purple: {
        main: '#F9E8FF',
        accent: '#EAACFB',
        dark: '#7E1A8E',
      },
      red: {
        main: '#FEE5E7',
        accent: '#FAA7B0',
        dark: '#9A1739',
      },
      orange: {
        main: '#FFEAC6',
        accent: '#FFAF3A',
        dark: '#94280C',
      },
      yellow: {
        main: '#FEFFBD',
        accent: '#FFF544',
        dark: '#87590C',
      },
      lime: {
        main: '#F1FFC7',
        accent: '#D4FF72',
        dark: '#46690B',
      },
      green: {
        main: '#C2F0C9',
        accent: '#5ECE71',
        dark: '#1B4C24',
      },
      aqua: {
        main: '#D1F6F2',
        accent: '#6CDCD6',
        dark: '#195356',
      },
      blue: {
        main: '#DFF2FF',
        accent: '#77D4FF',
        dark: '#015A8B',
      },
      comet: {
        main: '#ECEEF2',
        accent: '#AEB9CB',
        dark: '#384154',
      },
      storm: {
        main: '#ECECF2',
        accent: '#B1B2C8',
        dark: '#3B3B51',
      },
      wine: {
        main: '#F1ECF2',
        accent: '#C3B2C7',
        dark: '#4E3B51',
      },
      cosmic: {
        main: '#E0D5C8',
        accent: '#B19176',
        dark: '#603B4B',
      },
      sand: {
        main: '#F0EBE4',
        accent: '#CCB9A5',
        dark: '#694C43',
      },
      husk: {
        main: '#F2F2E2',
        accent: '#D2CE9F',
        dark: '#705F3C',
      },
      bean: {
        main: '#E9EBDC',
        accent: '#BCC294',
        dark: '#42472D',
      },
      forest: {
        main: '#E4E9E2',
        accent: '#9BAE98',
        dark: '#2B3A2B',
      },
      sea: {
        main: '#DDEAE7',
        accent: '#9FC0BC',
        dark: '#2D4242',
      },
      glacier: {
        main: '#CCDDE1',
        accent: '#95B0B7',
        dark: '#2E3E4B',
      },
      default: {
        main: '#F1F7F9',
        accent: '#CCDDE1',
        dark: '#1E353B',
      },
    },
    mode: 'dark',
  },
});

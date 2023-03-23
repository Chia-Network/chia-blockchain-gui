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
    sidebarBackground: theme.palette.sidebarBackground.dark,
    colors: {
      royal: {
        main: '#DCE6FD',
        border: '#7EA9F8',
        accent: '#2333AA',
      },
      grape: {
        main: '#E6E7F9',
        border: '#C3C3EE',
        accent: '#57478C',
      },
      purple: {
        main: '#F9E8FF',
        border: '#EAACFB',
        accent: '#7E1A8E',
      },
      red: {
        main: '#FEE5E7',
        border: '#FAA7B0',
        accent: '#9A1739',
      },
      orange: {
        main: '#FFEAC6',
        border: '#FFAF3A',
        accent: '#94280C',
      },
      yellow: {
        main: '#FEFFBD',
        border: '#FFF544',
        accent: '#87590C',
      },
      lime: {
        main: '#F1FFC7',
        border: '#D4FF72',
        accent: '#46690B',
      },
      green: {
        main: '#C2F0C9',
        border: '#5ECE71',
        accent: '#1B4C24',
      },
      aqua: {
        main: '#D1F6F2',
        border: '#6CDCD6',
        accent: '#195356',
      },
      blue: {
        main: '#DFF2FF',
        border: '#77D4FF',
        accent: '#015A8B',
      },
      comet: {
        main: '#ECEEF2',
        border: '#AEB9CB',
        accent: '#384154',
      },
      storm: {
        main: '#ECECF2',
        border: '#B1B2C8',
        accent: '#3B3B51',
      },
      wine: {
        main: '#F1ECF2',
        border: '#C3B2C7',
        accent: '#4E3B51',
      },
      cosmic: {
        main: '#E0D5C8',
        border: '#B19176',
        accent: '#603B4B',
      },
      sand: {
        main: '#F0EBE4',
        border: '#CCB9A5',
        accent: '#694C43',
      },
      husk: {
        main: '#F2F2E2',
        border: '#D2CE9F',
        accent: '#705F3C',
      },
      bean: {
        main: '#E9EBDC',
        border: '#BCC294',
        accent: '#42472D',
      },
      forest: {
        main: '#E4E9E2',
        border: '#9BAE98',
        accent: '#2B3A2B',
      },
      sea: {
        main: '#DDEAE7',
        border: '#9FC0BC',
        accent: '#2D4242',
      },
      glacier: {
        main: '#CCDDE1',
        border: '#95B0B7',
        accent: '#2E3E4B',
      },
      default: {
        main: '#F1F7F9',
        border: '#CCDDE1',
        accent: '#1E353B',
      },
    },
    mode: 'dark',
  },
});

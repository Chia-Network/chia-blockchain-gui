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
    royal: {
      main: '#DCE6FD',
    },
    royalAccent: {
      main: '#7EA9F8',
    },
    royalDark: {
      main: '#2333AA',
    },
    grape: {
      main: '#E6E7F9',
    },
    grapeAccent: {
      main: '#C3C3EE',
    },
    grapeDark: {
      main: '#57478C',
    },
    purple: {
      main: '#F9E8FF',
    },
    purpleAccent: {
      main: '#EAACFB',
    },
    purpleDark: {
      main: '#7E1A8E',
    },
    red: {
      main: '#FEE5E7',
    },
    redAccent: {
      main: '#FAA7B0',
    },
    redDark: {
      main: '#9A1739',
    },
    orange: {
      main: '#FFEAC6',
    },
    orangeAccent: {
      main: '#FFAF3A',
    },
    orangeDark: {
      main: '#94280C',
    },
    yellow: {
      main: '#FEFFBD',
    },
    yellowAccent: {
      main: '#FFF544',
    },
    yellowDark: {
      main: '#87590C',
    },
    lime: {
      main: '#F1FFC7',
    },
    limeAccent: {
      main: '#D4FF72',
    },
    limeDark: {
      main: '#46690B',
    },
    green: {
      main: '#C2F0C9',
    },
    greenAccent: {
      main: '#5ECE71',
    },
    greenDark: {
      main: '#1B4C24',
    },
    aqua: {
      main: '#D1F6F2',
    },
    aquaAccent: {
      main: '#6CDCD6',
    },
    aquaDark: {
      main: '#195356',
    },
    blue: {
      main: '#DFF2FF',
    },
    blueAccent: {
      main: '#77D4FF',
    },
    blueDark: {
      main: '#015A8B',
    },
    comet: {
      main: '#ECEEF2',
    },
    cometAccent: {
      main: '#AEB9CB',
    },
    cometDark: {
      main: '#384154',
    },
    storm: {
      main: '#ECECF2',
    },
    stormAccent: {
      main: '#B1B2C8',
    },
    stormDark: {
      main: '#3B3B51',
    },
    wine: {
      main: '#F1ECF2',
    },
    wineAccent: {
      main: '#C3B2C7',
    },
    wineDark: {
      main: '#4E3B51',
    },
    sand: {
      main: '#F0EBE4',
    },
    sandAccent: {
      main: '#CCB9A5',
    },
    sandDark: {
      main: '#694C43',
    },
    husk: {
      main: '#F2F2E2',
    },
    huskAccent: {
      main: '#D2CE9F',
    },
    huskDark: {
      main: '#705F3C',
    },
    bean: {
      main: '#E9EBDC',
    },
    beanAccent: {
      main: '#BCC294',
    },
    beanDark: {
      main: '#42472D',
    },
    forest: {
      main: '#E4E9E2',
    },
    forestAccent: {
      main: '#9BAE98',
    },
    forestDark: {
      main: '#2B3A2B',
    },
    sea: {
      main: '#DDEAE7',
    },
    seaAccent: {
      main: '#9FC0BC',
    },
    seaDark: {
      main: '#2D4242',
    },
    mode: 'dark',
  },
});

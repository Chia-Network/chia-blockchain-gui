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
    grape: {
      main: '#E6E7F9',
    },
    grapeAccent: {
      main: '#C3C3EE',
    },
    purple: {
      main: '#F9E8FF',
    },
    purpleAccent: {
      main: '#EAACFB',
    },
    red: {
      main: '#FEE5E7',
    },
    redAccent: {
      main: '#FAA7B0',
    },
    orange: {
      main: '#FFEAC6',
    },
    orangeAccent: {
      main: '#FFAF3A',
    },
    yellow: {
      main: '#FEFFBD',
    },
    yellowAccent: {
      main: '#FFF544',
    },
    lime: {
      main: '#F1FFC7',
    },
    limeAccent: {
      main: '#D4FF72',
    },
    green: {
      main: '#C2F0C9',
    },
    greenAccent: {
      main: '#5ECE71',
    },
    aqua: {
      main: '#D1F6F2',
    },
    aquaAccent: {
      main: '#6CDCD6',
    },
    blue: {
      main: '#DFF2FF',
    },
    blueAccent: {
      main: '#77D4FF',
    },
    comet: {
      main: '#ECEEF2',
    },
    cometAccent: {
      main: '#AEB9CB',
    },
    storm: {
      main: '#ECECF2',
    },
    stormAccent: {
      main: '#B1B2C8',
    },
    wine: {
      main: '#F1ECF2',
    },
    wineAccent: {
      main: '#C3B2C7',
    },
    sand: {
      main: '#F0EBE4',
    },
    sandAccent: {
      main: '#CCB9A5',
    },
    husk: {
      main: '#F2F2E2',
    },
    huskAccent: {
      main: '#D2CE9F',
    },
    bean: {
      main: '#E9EBDC',
    },
    beanAccent: {
      main: '#BCC294',
    },
    forest: {
      main: '#E4E9E2',
    },
    forestAccent: {
      main: '#9BAE98',
    },
    sea: {
      main: '#DDEAE7',
    },
    seaAccent: {
      main: '#9FC0BC',
    },
    mode: 'dark',
  },
});

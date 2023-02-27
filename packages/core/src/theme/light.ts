import { createTheme } from '@mui/material/styles';

import theme from './default';

export default createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    background: {
      ...theme.palette.background,
      card: '#fff',
    },
    royal: {
      main: '#C1D4FC',
    },
    royalAccent: {
      main: '#6595F5',
    },
    royalDark: {
      main: '#223086',
    },
    grape: {
      main: '#D2D3F3',
    },
    grapeAccent: {
      main: '#9E99E0',
    },
    grapeDark: {
      main: '#493F70',
    },
    purple: {
      main: '#F2D0FE',
    },
    purpleAccent: {
      main: '#DC6EF7',
    },
    purpleDark: {
      main: '#691B74',
    },
    red: {
      main: '#FCCFD3',
    },
    redAccent: {
      main: '#F56073',
    },
    redDark: {
      main: '#841737',
    },
    orange: {
      main: '#FFD388',
    },
    orangeAccent: {
      main: '#FF9B20',
    },
    orangeDark: {
      main: '#7A220D',
    },
    yellow: {
      main: '#FFFD88',
    },
    yellowAccent: {
      main: '#EECC04',
    },
    yellowDark: {
      main: '#734910',
    },
    lime: {
      main: '#D4FF72',
    },
    limeAccent: {
      main: '#94DD05',
    },
    limeDark: {
      main: '#3B590E',
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
      main: '#A2EDE6',
    },
    aquaAccent: {
      main: '#3EC3C1',
    },
    aquaDark: {
      main: '#194648',
    },
    blue: {
      main: '#B7E6FF',
    },
    blueAccent: {
      main: '#2FBEFF',
    },
    blueDark: {
      main: '#084A72',
    },
    comet: {
      main: '#D4D9E3',
    },
    cometAccent: {
      main: '#8292AE',
    },
    cometDark: {
      main: '#323948',
    },
    storm: {
      main: '#D5D5E2',
    },
    stormAccent: {
      main: '#8789A9',
    },
    stormDark: {
      main: '#353446',
    },
    wine: {
      main: '#DFD6E1',
    },
    wineAccent: {
      main: '#A188A8',
    },
    wineDark: {
      main: '#433545',
    },
    sand: {
      main: '#E0D5C8',
    },
    sandAccent: {
      main: '#B19176',
    },
    sandDark: {
      main: '#564038',
    },
    husk: {
      main: '#E4E2C4',
    },
    huskAccent: {
      main: '#C3BA7F',
    },
    huskDark: {
      main: '#5B4E33',
    },
    bean: {
      main: '#D7DABC',
    },
    beanAccent: {
      main: '#A1AA71',
    },
    beanDark: {
      main: '#393E29',
    },
    forest: {
      main: '#C9D3C7',
    },
    forestAccent: {
      main: '#799176',
    },
    forestDark: {
      main: '#243024',
    },
    sea: {
      main: '#BBD4D0',
    },
    seaAccent: {
      main: '#6A9793',
    },
    seaDark: {
      main: '#293838',
    },
  },
});

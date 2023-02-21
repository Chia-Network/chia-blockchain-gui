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
    grape: {
      main: '#D2D3F3',
    },
    grapeAccent: {
      main: '#9E99E0',
    },
    purple: {
      main: '#F2D0FE',
    },
    purpleAccent: {
      main: '#DC6EF7',
    },
    red: {
      main: '#FCCFD3',
    },
    redAccent: {
      main: '#F56073',
    },
    orange: {
      main: '#FFD388',
    },
    orangeAccent: {
      main: '#FF9B20',
    },
    yellow: {
      main: '#FFFD88',
    },
    yellowAccent: {
      main: '#EECC04',
    },
    lime: {
      main: '#D4FF72',
    },
    limeAccent: {
      main: '#94DD05',
    },
    green: {
      main: '#C2F0C9',
    },
    greenAccent: {
      main: '#5ECE71',
    },
    aqua: {
      main: '#A2EDE6',
    },
    aquaAccent: {
      main: '#3EC3C1',
    },
    blue: {
      main: '#B7E6FF',
    },
    blueAccent: {
      main: '#2FBEFF',
    },
    comet: {
      main: '#D4D9E3',
    },
    cometAccent: {
      main: '#8292AE',
    },
    storm: {
      main: '#D5D5E2',
    },
    stormAccent: {
      main: '#8789A9',
    },
    wine: {
      main: '#DFD6E1',
    },
    wineAccent: {
      main: '#A188A8',
    },
    sand: {
      main: '#E0D5C8',
    },
    sandAccent: {
      main: '#B19176',
    },
    husk: {
      main: '#E4E2C4',
    },
    huskAccent: {
      main: '#C3BA7F',
    },
    bean: {
      main: '#D7DABC',
    },
    beanAccent: {
      main: '#A1AA71',
    },
    forest: {
      main: '#C9D3C7',
    },
    forestAccent: {
      main: '#799176',
    },
    sea: {
      main: '#BBD4D0',
    },
    seaAccent: {
      main: '#6A9793',
    },
  },
});

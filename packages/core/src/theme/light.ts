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
    sidebarBackground: theme.palette.sidebarBackground.main,
    colors: {
      royal: {
        main: '#C1D4FC',
        border: '#6595F5',
        accent: '#223086',
      },
      grape: {
        main: '#D2D3F3',
        border: '#9E99E0',
        accent: '#493F70',
      },
      purple: {
        main: '#F2D0FE',
        border: '#DC6EF7',
        accent: '#691B74',
      },
      red: {
        main: '#FCCFD3',
        border: '#F56073',
        accent: '#841737',
      },
      orange: {
        main: '#FFD388',
        border: '#FF9B20',
        accent: '#7A220D',
      },
      yellow: {
        main: '#FFFD88',
        border: '#EECC04',
        accent: '#734910',
      },
      lime: {
        main: '#D4FF72',
        border: '#94DD05',
        accent: '#3B590E',
      },
      green: {
        main: '#C2F0C9',
        border: '#5ECE71',
        accent: '#1B4C24',
      },
      aqua: {
        main: '#A2EDE6',
        border: '#3EC3C1',
        accent: '#194648',
      },
      blue: {
        main: '#B7E6FF',
        border: '#2FBEFF',
        accent: '#084A72',
      },
      comet: {
        main: '#D4D9E3',
        border: '#8292AE',
        accent: '#323948',
      },
      storm: {
        main: '#D5D5E2',
        border: '#8789A9',
        accent: '#353446',
      },
      wine: {
        main: '#DFD6E1',
        border: '#A188A8',
        accent: '#433545',
      },
      cosmic: {
        main: '#F5EEF2',
        border: '#DEC3D3',
        accent: '#564038',
      },
      sand: {
        main: '#E0D5C8',
        border: '#B19176',
        accent: '#564038',
      },
      husk: {
        main: '#E4E2C4',
        border: '#C3BA7F',
        accent: '#5B4E33',
      },
      bean: {
        main: '#D7DABC',
        border: '#A1AA71',
        accent: '#393E29',
      },
      forest: {
        main: '#C9D3C7',
        border: '#799176',
        accent: '#243024',
      },
      sea: {
        main: '#BBD4D0',
        border: '#6A9793',
        accent: '#293838',
      },
      glacier: {
        main: '#F1F7F9',
        border: '#CCDDE1',
        accent: '#0F252A',
      },
      default: {
        main: '#E2EDF0',
        border: '#95B0B7',
        accent: '#0F252A',
      },
    },
  },
});

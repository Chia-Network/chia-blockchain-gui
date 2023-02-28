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

    colors: {
      royal: {
        main: '#C1D4FC',
        accent: '#6595F5',
        dark: '#223086',
      },
      grape: {
        main: '#D2D3F3',
        accent: '#9E99E0',
        dark: '#493F70',
      },
      purple: {
        main: '#F2D0FE',
        accent: '#DC6EF7',
        dark: '#691B74',
      },
      red: {
        main: '#FCCFD3',
        accent: '#F56073',
        dark: '#841737',
      },
      orange: {
        main: '#FFD388',
        accent: '#FF9B20',
        dark: '#7A220D',
      },
      yellow: {
        main: '#FFFD88',
        accent: '#EECC04',
        dark: '#734910',
      },
      lime: {
        main: '#D4FF72',
        accent: '#94DD05',
        dark: '#3B590E',
      },
      green: {
        main: '#C2F0C9',
        accent: '#5ECE71',
        dark: '#1B4C24',
      },
      aqua: {
        main: '#A2EDE6',
        accent: '#3EC3C1',
        dark: '#194648',
      },
      blue: {
        main: '#B7E6FF',
        accent: '#2FBEFF',
        dark: '#084A72',
      },
      comet: {
        main: '#D4D9E3',
        accent: '#8292AE',
        dark: '#323948',
      },
      storm: {
        main: '#D5D5E2',
        accent: '#8789A9',
        dark: '#353446',
      },
      wine: {
        main: '#DFD6E1',
        accent: '#A188A8',
        dark: '#433545',
      },
      cosmic: {
        main: '#F5EEF2',
        accent: '#DEC3D3',
        dark: '#564038',
      },
      sand: {
        main: '#E0D5C8',
        accent: '#B19176',
        dark: '#564038',
      },
      husk: {
        main: '#E4E2C4',
        accent: '#C3BA7F',
        dark: '#5B4E33',
      },
      bean: {
        main: '#D7DABC',
        accent: '#A1AA71',
        dark: '#393E29',
      },
      forest: {
        main: '#C9D3C7',
        accent: '#799176',
        dark: '#243024',
      },
      sea: {
        main: '#BBD4D0',
        accent: '#6A9793',
        dark: '#293838',
      },
      glacier: {
        main: '#F1F7F9',
        accent: '#CCDDE1',
        dark: '#0F252A',
      },
      default: {
        main: '#E2EDF0',
        accent: '#95B0B7',
        dark: '#0F252A',
      },
    },
  },
});

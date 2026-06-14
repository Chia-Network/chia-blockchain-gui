import Color from '../../../constants/Color';

import { ChiaBrand2025 as B } from './brandColors';

declare module '@mui/material' {
  interface Color {
    main: string;
    dark: string;
  }
}

export default {
  palette: {
    background: {
      default: B.brightWhite,
    },
    primary: {
      main: B.starkBlue,
      contrastText: B.brightWhite,
    },
    secondary: {
      main: B.morpheus,
      contrastText: B.brightWhite,
    },
    danger: {
      main: Color.Red[600],
      contrastText: B.brightWhite,
    },
    highlight: {
      main: B.periwinklePursuit,
    },
    warning: {
      main: B.periwinklePursuit,
      contrastText: B.morpheus,
    },
    border: {
      main: B.periwinklePursuit,
      dark: B.starkBlue,
    },
    sidebarBackground: {
      main: B.starkBlue,
      dark: B.morpheus,
    },
    sidebarSelectedFill: {
      main: 'rgba(210, 227, 254, 0.24)',
      dark: 'rgba(168, 190, 241, 0.2)',
    },
    sidebarIconSelected: {
      main: B.brightWhite,
      dark: B.brightWhite,
    },
    sidebarIcon: {
      main: B.mysticBlue,
      dark: B.periwinklePursuit,
    },
    sidebarIconHover: {
      main: B.brightWhite,
      dark: B.mysticBlue,
    },
    sidebarText: {
      main: B.mysticBlue,
      dark: 'rgba(210, 227, 254, 0.82)',
    },
    info: {
      main: B.starkBlue,
      dark: B.brightWhite,
    },
  },
  drawer: {
    width: '72px',
  },
  mixins: {
    toolbar: {
      minHeight: '90px',
    },
  },
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: B.starkBlue,
        },
      },
    },
    MuiSvgIcon: {
      variants: [
        {
          props: { fontSize: 'extraLarge' },
          style: {
            fontSize: '3rem',
          },
        },
        {
          props: { fontSize: 'sidebarIcon' },
          style: {
            fontSize: '2rem',
          },
        },
        {
          props: { fontSize: 'notificationIcon' },
          style: {
            fontSize: '5rem',
          },
        },
      ],
    },
    MuiTypography: {
      variants: [
        {
          props: { variant: 'h6' },
          style: {
            fontWeight: 400,
          },
        },
      ],
    },
    MuiChip: {
      variants: [
        {
          props: { size: 'extraSmall' },
          style: {
            height: '20px',
            fontSize: '0.75rem',
            '.MuiChip-label': {
              paddingLeft: '6px',
              paddingRight: '6px',
            },
          },
        },
      ],
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: B.starkBlue,
          color: B.brightWhite,
          '&:hover': {
            backgroundColor: B.morpheus,
          },
        },
        outlined: {
          borderColor: B.starkBlue,
          color: B.starkBlue,
          '&:hover': {
            borderColor: B.morpheus,
            backgroundColor: 'rgba(210, 227, 254, 0.35)',
          },
        },
      },
    },
  },
};

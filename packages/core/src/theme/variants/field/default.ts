import Color from '../../../constants/Color';

declare module '@mui/material' {
  interface Color {
    main: string;
    dark: string;
  }
}

export default {
  palette: {
    background: {
      default: Color.Neutral[50],
    },
    primary: {
      main: '#b98524',
      contrastText: Color.Neutral[50],
    },
    secondary: {
      main: Color.Neutral[900],
      contrastText: Color.Neutral[50],
    },
    danger: {
      main: Color.Red[600],
      contrastText: Color.Neutral[50],
    },
    highlight: {
      main: '#d09a2d',
    },
    warning: {
      main: Color.Orange[500],
      contrastText: Color.Neutral[50],
    },
    border: {
      main: Color.Neutral[300],
      dark: Color.Neutral[700],
    },
    sidebarBackground: {
      main: '#302c1f',
      dark: '#211d13',
    },
    sidebarIconSelected: {
      main: '#f7df9b',
      dark: '#f7df9b',
    },
    sidebarIcon: {
      main: Color.Neutral[500],
      dark: Color.Neutral[400],
    },
    sidebarIconHover: {
      main: Color.Neutral[700],
      dark: Color.Neutral[50],
    },
    info: {
      main: Color.Neutral[500],
      dark: Color.Neutral[50],
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
          backgroundColor: Color.Neutral[500],
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
  },
};

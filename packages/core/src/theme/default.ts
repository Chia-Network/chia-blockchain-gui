import Color from '../constants/Color';

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
      main: Color.Green[500],
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
      main: Color.Chia.Primary,
    },
    border: {
      main: Color.Neutral[300],
      dark: Color.Neutral[700],
    },
    sidebarBackground: {
      main: Color.Green[50],
      dark: Color.Neutral[600],
    },
    sidebarIconSelected: {
      main: Color.Green[800],
      dark: Color.Green[500],
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

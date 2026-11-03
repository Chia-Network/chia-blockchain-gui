declare module '@mui/material' {
  interface Color {
    main: string;
    dark: string;
  }
}

/** Layout values shared by the chia.net light and dark themes. */
export default {
  drawer: {
    width: '72px',
  },
  mixins: {
    toolbar: {
      minHeight: '90px',
    },
  },
  shape: {
    borderRadius: 6,
  },
};

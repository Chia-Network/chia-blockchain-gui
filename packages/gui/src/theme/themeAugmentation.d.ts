import '@mui/material/styles';

type ChiaPaletteColor = {
  main: string;
  light?: string;
  dark?: string;
  contrastText?: string;
};

type ChiaPaletteBorder = {
  main: string;
  dark: string;
};

declare module '@mui/material/styles' {
  interface Palette {
    border: ChiaPaletteBorder;
    danger?: ChiaPaletteColor;
    highlight?: ChiaPaletteColor;
  }

  interface PaletteOptions {
    border?: Partial<ChiaPaletteBorder>;
    danger?: ChiaPaletteColor;
    highlight?: ChiaPaletteColor;
  }

  interface TypeBackground {
    card: string;
  }
}

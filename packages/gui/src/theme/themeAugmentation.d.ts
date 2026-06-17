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

type ChiaSemanticPalette = {
  success?: string;
  warning?: string;
  error?: string;
  highlight?: string;
};

declare module '@mui/material/styles' {
  interface Palette {
    border: ChiaPaletteBorder;
    danger?: ChiaPaletteColor;
    highlight?: ChiaPaletteColor;
    semantic?: ChiaSemanticPalette;
  }

  interface PaletteOptions {
    border?: Partial<ChiaPaletteBorder>;
    danger?: ChiaPaletteColor;
    highlight?: ChiaPaletteColor;
    semantic?: ChiaSemanticPalette;
  }

  interface TypeBackground {
    card: string;
  }
}

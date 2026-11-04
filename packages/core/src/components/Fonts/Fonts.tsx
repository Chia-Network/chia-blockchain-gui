import { useTheme } from '@mui/material/styles';
import React from 'react';
import { createGlobalStyle } from 'styled-components';

import '@fontsource/barlow/600.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';

import { THEME_TYPOGRAPHY } from '../../theme/typography';
import { DEFAULT_THEME_VARIANT, parseThemeVariantId } from '../../theme/variantTypes';

function getVariantFromTheme(theme: { chiaTheme?: { variant?: unknown } }) {
  return parseThemeVariantId(theme.chiaTheme?.variant, DEFAULT_THEME_VARIANT);
}

// Chia Green on light backgrounds, Chia Light Green on dark ones. The chia.net wordmark reads it.
const LOGO_FILL = { light: '#35a754', dark: '#4ebc6d' } as const;

const GlobalStyle = createGlobalStyle<{
  $fontFamily: string;
  $logoFill: string;
  $monoFontFamily?: string;
  $amountNumeric?: string;
}>`
  :root {
    --chia-logo-fill: ${(props) => props.$logoFill};
    ${(props) => (props.$monoFontFamily ? `--chia-font-mono: ${props.$monoFontFamily};` : '')}
    ${(props) => (props.$amountNumeric ? `--chia-numeric: ${props.$amountNumeric};` : '')}
  }

  body {
    font-family: ${(props) => props.$fontFamily};
  }
`;

export default function Fonts() {
  const theme = useTheme();
  const variant = getVariantFromTheme(theme);
  const { fontFamily, monoFontFamily, amountNumeric } = THEME_TYPOGRAPHY[variant];

  return (
    <GlobalStyle
      $fontFamily={fontFamily}
      $logoFill={LOGO_FILL[theme.palette.mode]}
      $monoFontFamily={monoFontFamily}
      $amountNumeric={amountNumeric}
    />
  );
}

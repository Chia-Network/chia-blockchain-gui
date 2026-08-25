import { useTheme } from '@mui/material/styles';
import React from 'react';
import { createGlobalStyle } from 'styled-components';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';

import { THEME_TYPOGRAPHY } from '../../theme/typography';
import { DEFAULT_THEME_VARIANT, parseThemeVariantId } from '../../theme/variantTypes';

function getVariantFromTheme(theme: { chiaTheme?: { variant?: unknown } }) {
  return parseThemeVariantId(theme.chiaTheme?.variant, DEFAULT_THEME_VARIANT);
}

const GlobalStyle = createGlobalStyle<{ $fontFamily: string }>`
  body {
    font-family: ${(props) => props.$fontFamily};
  }
`;

export default function Fonts() {
  const theme = useTheme();
  const variant = getVariantFromTheme(theme);
  const { fontFamily } = THEME_TYPOGRAPHY[variant];

  return <GlobalStyle $fontFamily={fontFamily} />;
}

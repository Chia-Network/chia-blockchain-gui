import { Box, BoxProps } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import { ThemedChia } from '../ThemedChia';

const StyledChia = styled(ThemedChia)`
  max-width: 100%;
  width: auto;
  height: auto;
`;

export default function Logo(props: BoxProps) {
  return (
    <Box {...props}>
      <StyledChia />
    </Box>
  );
}

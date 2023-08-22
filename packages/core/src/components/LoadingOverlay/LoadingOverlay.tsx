import { alpha, Box } from '@mui/material';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

import Color from '../../constants/Color';
import Loading from '../Loading';

const StyledLoadingContainer = styled(Box)`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${alpha(Color.Neutral[900], 0.2)};
`;

export type LoadingOverlayProps = {
  children?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
};

export default function LoadingOverlay(props: LoadingOverlayProps) {
  const { children, loading = false, disabled = false } = props;

  return (
    <Box width="100%" position="relative">
      {children}
      {(loading || disabled) && <StyledLoadingContainer>{!disabled && <Loading center />}</StyledLoadingContainer>}
    </Box>
  );
}

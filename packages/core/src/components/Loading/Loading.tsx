import { CircularProgress, CircularProgressProps, Typography } from '@mui/material';
import React, { type ReactNode } from 'react';
import styled from 'styled-components';

import Color from '../../constants/Color';
import Flex from '../Flex';

const StyledCircularProgress = styled(CircularProgress)`
  color: ${({ theme }) => (theme.palette.mode === 'dark' ? Color.Neutral[50] : 'inherit')};
`;

export type LoadingProps = CircularProgressProps & {
  children?: ReactNode;
  center?: boolean;
};

export default function Loading(props: LoadingProps) {
  const { children, center = false, ...rest } = props;

  if (children) {
    return (
      <Flex flexDirection="column" gap={1} alignItems="center">
        <StyledCircularProgress {...rest} />
        <Typography variant="body1" align="center">
          {children}
        </Typography>
      </Flex>
    );
  }

  if (center) {
    return (
      <Flex flexDirection="column" gap={1} alignItems="center">
        <StyledCircularProgress {...rest} />
      </Flex>
    );
  }

  return <StyledCircularProgress {...rest} />;
}

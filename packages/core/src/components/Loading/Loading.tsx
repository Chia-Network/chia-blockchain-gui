import React, { type ReactNode } from 'react';
import {
  CircularProgress,
  CircularProgressProps,
  Typography,
} from '@mui/material';
import styled from 'styled-components';
import Flex from '../Flex';

const StyledCircularProgress = styled(CircularProgress)`
  color: ${({ theme }) =>
    theme.palette.mode === 'dark' ? 'white' : 'inherit'}; ;
`;

export type LoadingProps = CircularProgressProps & {
  children?: ReactNode;
  center?: boolean;
};

export default function Loading(props: LoadingProps) {
  const { children, center, ...rest } = props;

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
      <Flex
        flexDirection="column"
        gap={1}
        alignItems="center"
      >
        <StyledCircularProgress {...rest} />
      </Flex>
    );
  }

  return <StyledCircularProgress {...rest} />;
}

Loading.defaultProps = {
  children: undefined,
  center: false,
};

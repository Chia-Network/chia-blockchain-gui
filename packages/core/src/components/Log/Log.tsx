import { Paper } from '@mui/material';
import React, { ReactNode } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import styled from 'styled-components';
// @ts-ignore

const StyledScrollToBottom = styled(ScrollToBottom)`
  width: 100%;
  height: 100%;
`;

const StyledPaper = styled(Paper)`
  background-color: #272c34;
  color: white;
  min-width: 50vw;
  width: 100%;
  height: 40vh;

  pre {
    word-break: break-all;
    white-space: pre-wrap;
    font-size: 14px;
    padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(2)}`};
  }
`;

type Props = {
  children?: ReactNode;
};

export default function Log(props: Props) {
  const { children } = props;

  return (
    <StyledPaper>
      <StyledScrollToBottom debug={false}>
        <pre>{children}</pre>
      </StyledScrollToBottom>
    </StyledPaper>
  );
}

Log.defaultProps = {
  children: undefined,
};

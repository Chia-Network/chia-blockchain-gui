import React, { ReactNode } from 'react';
import { AppBar, Toolbar, Box } from '@material-ui/core';
import styled from 'styled-components';
import { Flex, DarkModeToggle, LocaleToggle } from '@chia/core';
import AppTimeBombAlert from '../app/AppTimeBombAlert';

const StyledWrapper = styled(Box)`
  padding-top: ${({ theme }) => `${theme.spacing(3)}px`};
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background: ${({ theme }) =>
    theme.palette.type === 'dark'
      ? `linear-gradient(45deg, #222222 30%, #333333 90%)`
      : `linear-gradient(45deg, #ffffff 30%, #fdfdfd 90%)`};
`;

const StyledBody = styled(Box)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
`;

type Props = {
  children?: ReactNode;
  header?: ReactNode;
};

export default function LayoutHero(props: Props) {
  const { children, header } = props;

  return (
    <StyledWrapper>
      <AppBar color="transparent" elevation={0}>
        <Toolbar>
          {header}
          <Flex flexGrow={1} />
          <LocaleToggle />
          <DarkModeToggle />
        </Toolbar>
      </AppBar>
      <StyledBody>
        <Flex flexDirection="column" gap={2} alignItems="center">
          <AppTimeBombAlert />
          {children}
        </Flex>
      </StyledBody>
    </StyledWrapper>
  );
}

LayoutHero.defaultProps = {
  header: undefined,
  children: undefined,
};

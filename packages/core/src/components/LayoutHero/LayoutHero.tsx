import { ArrowBackIos as ArrowBackIosIcon } from '@mui/icons-material';
import { AppBar, Toolbar, Box } from '@mui/material';
import React, { type ReactNode } from 'react';
import { Outlet, Link } from 'react-router-dom';
import styled from 'styled-components';

import Color from '../../constants/Color';
import Flex from '../Flex';

const StyledWrapper = styled(Box)`
  padding-top: ${({ theme }) => `${theme.spacing(3)}`};
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background: ${({ theme }) =>
    theme.palette.mode === 'dark'
      ? `linear-gradient(45deg, ${Color.Neutral[900]} 30%, ${Color.Neutral[800]} 90%)`
      : `linear-gradient(45deg, ${Color.Neutral[50]} 30%, ${Color.Neutral[100]} 90%)`};
`;

const StyledBody = styled(Box)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  padding-bottom: 1rem;
`;

export type LayoutHeroProps = {
  children?: ReactNode;
  header?: ReactNode;
  back?: boolean;
  outlet?: boolean;
};

export default function LayoutHero(props: LayoutHeroProps) {
  const { children, header, back = false, outlet = false } = props;

  return (
    <StyledWrapper>
      <AppBar color="transparent" elevation={0}>
        {back && (
          <Toolbar>
            {header}
            <Link to="-1">
              <ArrowBackIosIcon fontSize="large" color="secondary" />
            </Link>

            <Flex flexGrow={1} />
            {/*! hideSettings && (
            <Settings>
              {settings}
            </Settings>
          ) */}
          </Toolbar>
        )}
      </AppBar>
      <StyledBody>
        <Flex flexDirection="column" gap={2} alignItems="center" alignSelf="stretch">
          {outlet ? <Outlet /> : children}
        </Flex>
      </StyledBody>
    </StyledWrapper>
  );
}

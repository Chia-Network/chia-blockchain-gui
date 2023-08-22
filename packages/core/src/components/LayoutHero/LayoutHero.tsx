import { ArrowBackIos as ArrowBackIosIcon } from '@mui/icons-material';
import { Toolbar, Box } from '@mui/material';
import React, { type ReactNode } from 'react';
import { Outlet, Link } from 'react-router-dom';
import styled from 'styled-components';

import Color from '../../constants/Color';
import Flex from '../Flex';
import { Scrollbar } from '../Scrollbar';

const StyledWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background: ${({ theme }) =>
    theme.palette.mode === 'dark'
      ? `linear-gradient(45deg, ${Color.Neutral[900]} 30%, ${Color.Neutral[800]} 90%)`
      : `linear-gradient(45deg, ${Color.Neutral[50]} 30%, ${Color.Neutral[100]} 90%)`};
`;

const StyledBody = styled(Scrollbar)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  height: 100%;
`;

export type LayoutHeroProps = {
  children?: ReactNode;
  back?: boolean;
  outlet?: boolean;
};

export default function LayoutHero(props: LayoutHeroProps) {
  const { children, back = false, outlet = false } = props;

  return (
    <StyledWrapper>
      <StyledBody>
        <Flex flexDirection="column" justifyContent="center" sx={{ py: 3, minHeight: '100%' }}>
          {back && (
            <Box sx={{ position: 'fixed', top: 0 }}>
              <Toolbar>
                <Link to="-1">
                  <ArrowBackIosIcon fontSize="large" color="secondary" />
                </Link>
              </Toolbar>
            </Box>
          )}
          <Flex flexDirection="column" gap={2} alignItems="center" alignSelf="stretch">
            {outlet ? <Outlet /> : children}
          </Flex>
        </Flex>
      </StyledBody>
    </StyledWrapper>
  );
}

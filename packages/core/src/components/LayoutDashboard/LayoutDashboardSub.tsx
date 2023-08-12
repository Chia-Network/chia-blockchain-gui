import { Box } from '@mui/material';
import React, { type ReactNode } from 'react';
import { Outlet } from 'react-router';
import styled from 'styled-components';

import Flex from '../Flex';
import { Scrollbar } from '../Scrollbar';

const StyledRoot = styled(Flex)`
  width: 100%;
  height: 100%;
`;

const StyledSidebar = styled(Box)`
  height: 100%;
  position: relative;
`;

const StyledHeader = styled(({ sidebar, gap, ...rest }) => <Box {...rest} />)`
  padding-top: ${({ theme }) => theme.spacing(3)};
  padding-bottom: ${({ theme, gap }) => theme.spacing(gap)};
  padding-right: ${({ theme }) => theme.spacing(3)};

  padding-left: ${({ theme, sidebar }) => (!sidebar ? theme.spacing(3) : '10px')};
  margin-left: ${({ sidebar }) => (!sidebar ? `0` : '-10px')};
`;

const StyledContent = styled(({ sidebar, ...rest }) => <Box {...rest} />)`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow-y: hidden;
  position: relative;
  margin-left: ${({ sidebar }) => (!sidebar ? `0` : '-10px')};
`;

const StyledScrollbarWrapper = styled(Scrollbar)`
  flex-grow: 1;
`;

const StyledContentWrapper = styled(({ header, sidebar, fullHeight, ...rest }) => <Box {...rest} />)`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  flex-grow: 1;
  position: relative;

  padding-top: ${({ theme, header }) => (header ? 0 : theme.spacing(3))};
  padding-bottom: ${({ theme, fullHeight }) => (fullHeight ? 0 : theme.spacing(3))};
  padding-right: ${({ theme }) => theme.spacing(3)};
  padding-left: ${({ theme, sidebar }) => (!sidebar ? theme.spacing(3) : '10px')};
`;

export type DashboardLayoutProps = {
  sidebar?: ReactNode;
  children?: ReactNode;
  header?: ReactNode;
  outlet?: boolean;
  gap?: number;
  fullHeight?: boolean;
  onScroll?: () => void;
};

export default function DashboardLayout(props: DashboardLayoutProps) {
  const { sidebar, children, outlet = false, fullHeight = false, gap = 3, header } = props;
  // two layout column with always visible left column
  // and right column with content
  return (
    <StyledRoot>
      {sidebar && <StyledSidebar>{sidebar}</StyledSidebar>}
      {header ? (
        <Flex flexDirection="column" flexGrow={1}>
          <StyledHeader sidebar={!!sidebar} gap={gap}>
            {header}
          </StyledHeader>
          <StyledContent sidebar={!!sidebar}>
            <StyledScrollbarWrapper onScroll={props?.onScroll}>
              <StyledContentWrapper fullHeight={fullHeight} header={!!header} sidebar={!!sidebar}>
                {outlet ? <Outlet /> : children}
              </StyledContentWrapper>
            </StyledScrollbarWrapper>
          </StyledContent>
        </Flex>
      ) : (
        <StyledContent sidebar={!!sidebar}>
          <StyledScrollbarWrapper onScroll={props?.onScroll}>
            <StyledContentWrapper fullHeight={fullHeight} sidebar={!!sidebar}>
              {outlet ? <Outlet /> : children}
            </StyledContentWrapper>
          </StyledScrollbarWrapper>
        </StyledContent>
      )}
    </StyledRoot>
  );
}

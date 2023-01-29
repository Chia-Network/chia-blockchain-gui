import { SvgIcon, SvgIconProps, styled, type Theme } from '@mui/material';
import React from 'react';

import HomeIcon from './images/home.svg';

function getColor({ theme }: { theme: Theme }) {
  return theme.palette.mode === 'dark' ? 'white' : '#757575';
}

const StyledHomeIcon = styled(HomeIcon)`
  path {
    stroke: ${getColor};
    stroke-width: 2;
  }
`;

export default function Home(props: SvgIconProps) {
  return <SvgIcon component={StyledHomeIcon} viewBox="0 0 32 31" {...props} />;
}

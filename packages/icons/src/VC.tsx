import { SvgIcon, SvgIconProps, styled, type Theme } from '@mui/material';
import React from 'react';

import VCIcon from './images/vc.svg';
import VCZeroStateBackgroundIcon from './images/vcZeroStateBackground.svg';
import VCZeroStateBackgroundDarkIcon from './images/vcZeroStateBackgroundDark.svg';
import VCZeroStateBadgeIcon from './images/vcZeroStateBadge.svg';
import VCZeroStateKYCIcon from './images/vcZeroStateKYC.svg';
import VCZeroStateMembershipIcon from './images/vcZeroStateMembership.svg';

function VCIconWithoutFill(props: SvgIconProps) {
  return <VCIcon {...props} style={{ fill: 'none' }} />;
}

export default function VC(props: SvgIconProps) {
  return <SvgIcon component={VCIconWithoutFill} inheritViewBox {...props} />;
}

export function VCZeroStateBackground(props: SvgIconProps) {
  return <VCZeroStateBackgroundIcon inheritViewBox {...props} />;
}
export function VCZeroStateBackgroundDark(props: SvgIconProps) {
  return <VCZeroStateBackgroundDarkIcon inheritViewBox {...props} />;
}

const styledBadge = (node: any) => styled(node)`
  rect {
    fill: ${({ theme }: { theme: Theme }) => (theme.palette as any).colors.default.backgroundBadge};
  }
  color: ${({ theme }: { theme: Theme }) =>
    theme.palette.mode === 'dark'
      ? (theme.palette as any).colors.default.accent
      : (theme.palette as any).colors.default.border};
`;

const StyledVCZeroStateBadge = styledBadge(VCZeroStateBadgeIcon);
const StyledVCZeroStateMembershipBadge = styledBadge(VCZeroStateMembershipIcon);
const StyledVCZeroStateKYCBadge = styledBadge(VCZeroStateKYCIcon);

export function VCZeroStateBadge(props: SvgIconProps) {
  return <StyledVCZeroStateBadge inheritViewBox {...props} />;
}

export function VCZeroStateMembership(props: SvgIconProps) {
  return <StyledVCZeroStateMembershipBadge inheritViewBox {...props} />;
}

export function VCZeroStateKYCBadge(props: SvgIconProps) {
  return <StyledVCZeroStateKYCBadge inheritViewBox {...props} />;
}

import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

import NFTsIcon from './images/NFTs.svg';
import NFTsSmallIcon from './images/NFTsSmall.svg';
import CopyIcon from './images/copy.svg';
import ReloadIcon from './images/reload.svg';

export function NFTsSmall(props: SvgIconProps) {
  return <SvgIcon component={NFTsSmallIcon} viewBox="0 0 18 18" {...props} />;
}

export default function NFTs(props: SvgIconProps) {
  return <SvgIcon component={NFTsIcon} viewBox="0 0 38 28" {...props} />;
}

export function Reload(props: SvgIconProps) {
  return <SvgIcon component={ReloadIcon} viewBox="-3 -3 26 26" {...props} />;
}

export function Copy(props: SvgIconProps) {
  return <SvgIcon component={CopyIcon} viewBox="0 0 22 22" {...props} />;
}

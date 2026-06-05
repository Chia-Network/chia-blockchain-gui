import { SvgIcon, type SvgIconProps } from '@mui/material';
import React from 'react';

import { useThemeAssets } from '../../theme/ThemeAssetsContext';

export function ThemedChia(props: SvgIconProps) {
  const { chiaWordmark } = useThemeAssets();
  return <SvgIcon component={chiaWordmark} viewBox="0 0 150 58" {...props} />;
}

export function ThemedChiaBlack(props: SvgIconProps) {
  const { chiaWordmarkBlack } = useThemeAssets();
  return (
    <SvgIcon component={chiaWordmarkBlack} viewBox="0 0 100 39" sx={{ width: '100px', height: '39px' }} {...props} />
  );
}

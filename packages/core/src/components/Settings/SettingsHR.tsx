import { useTheme } from '@mui/material/styles';
import React from 'react';

import useDarkMode from '../../hooks/useDarkMode';

export default function SettingsHR() {
  const theme = useTheme();
  const { isDarkMode } = useDarkMode();
  const backgroundColor = isDarkMode ? (theme.palette as any).border.dark : (theme.palette as any).border.main;

  return (
    <div>
      <hr
        style={{
          backgroundColor,
          height: 1,
          border: 0,
        }}
      />
    </div>
  );
}

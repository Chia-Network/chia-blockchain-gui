import { nativeTheme } from '@electron/remote';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import isElectron from 'is-electron';
import React from 'react';

import useDarkMode from '../../hooks/useDarkMode';

export default function DarkModeToggle() {
  const { toggle, isDarkMode } = useDarkMode();

  function handleClick() {
    toggle();
    if (isElectron()) {
      nativeTheme.themeSource = isDarkMode ? 'dark' : 'light';
    }
  }

  return (
    <IconButton color="inherit" onClick={handleClick}>
      {isDarkMode ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );
}

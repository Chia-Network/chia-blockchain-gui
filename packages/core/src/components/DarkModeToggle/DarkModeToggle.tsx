import React from 'react';
import { IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import useDarkMode from '../../hooks/useDarkMode';
import isElectron from 'is-electron';

export default function DarkModeToggle() {
  const { toggle, isDarkMode } = useDarkMode();

  function handleClick() {
    toggle();
    if (isElectron()) {
      const { nativeTheme } = window.require('@electron/remote');
      nativeTheme.themeSource = isDarkMode ? 'dark' : 'light';
    }
  }

  return (
    <IconButton color="inherit" onClick={handleClick}>
      {isDarkMode ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );
}

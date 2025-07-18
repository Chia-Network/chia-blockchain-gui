import { Brightness4, Brightness7 } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React from 'react';

import useDarkMode from '../../hooks/useDarkMode';

export default function DarkModeToggle() {
  const { toggle, isDarkMode } = useDarkMode();

  function handleClick() {
    toggle();
  }

  return (
    <IconButton color="inherit" onClick={handleClick}>
      {isDarkMode ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );
}

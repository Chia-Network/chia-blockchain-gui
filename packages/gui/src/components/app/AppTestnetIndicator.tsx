import { AlertDialog, Flex, Tooltip, useCurrencyCode, useDarkMode, useOpenDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

export default function AppTestnetIndicator() {
  const isTestnet = useCurrencyCode() === 'TXCH';
  const theme = useTheme();
  const { isDarkMode } = useDarkMode();
  const borderColor = (theme.palette as any).border[isDarkMode ? 'dark' : 'main'];
  const [clickCount, setClickCount] = useState(0);
  const openDialog = useOpenDialog();

  const BorderStyle = {
    borderRadius: 2,
    border: `1px solid ${borderColor}`,
    '&:hover': {
      border: `1px solid ${borderColor}`,
    },
  };

  function handleTestnetClick() {
    const numClicks = 5;
    const updatedClickCount = clickCount + 1;
    const messages = [
      'You must have a lot of free time on your hands.',
      "So, you're one of those people, eh?",
      'Go ahead, keep clicking. I dare you.',
      "You're not going to break anything.",
      "I'm not even mad.",
      'Ok, stop...',
      "I'm warning you...",
      "You're going to regret this...",
      "That's it, I'm sending all assets to the burn address 🔥🔥🔥",
      'Try again in another 108 minutes 4️⃣ 8️⃣ 1️⃣5️⃣ 1️⃣6️⃣ 2️⃣3️⃣ 4️⃣2️⃣ ↩️ 🏝',
    ];
    const messageIndex = updatedClickCount % numClicks === 0 ? Math.floor(updatedClickCount / numClicks - 1) : -1;

    if (messageIndex >= 0) {
      const message = messages[messageIndex];
      openDialog(<AlertDialog title="">{message}</AlertDialog>);
    }
    setClickCount(messageIndex === messages.length - 1 ? 0 : updatedClickCount);
  }

  return isTestnet ? (
    <Tooltip title={<Trans>Sorry, you can't switch to mainnet by clicking...</Trans>}>
      <Button
        variant="outlined"
        color="secondary"
        size="small"
        onClick={handleTestnetClick}
        sx={{
          ...BorderStyle,
          backgroundColor: theme.palette.primary.main,
          '&:hover': { backgroundColor: theme.palette.primary.main, border: `1px solid ${borderColor}` },
        }}
        disableRipple
      >
        <Flex gap={1} alignItems="center">
          <Typography
            variant="body2"
            color={theme.palette.primary.contrastText}
            sx={{ fontWeight: 500, textTransform: 'uppercase' }}
          >
            Testnet
          </Typography>
        </Flex>
      </Button>
    </Tooltip>
  ) : null;
}

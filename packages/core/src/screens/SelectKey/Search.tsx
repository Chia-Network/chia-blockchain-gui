import { Search as SearchIcon } from '@chia-network/icons';
import { t } from '@lingui/macro';
import { InputBase, InputBaseProps, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

export default function Search() {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: 'relative',
        border: `1px solid ${theme.palette.border.main}`,
        borderRadius: '8px',
        input: {
          paddingLeft: '35px',
        },
        padding: '8px 10px',
        width: '100%',
      }}
    >
      <SearchIcon
        sx={{
          position: 'absolute',
          left: '12px',
          top: '13px',
          path: {
            stroke: theme.palette.mode === 'dark' ? theme.palette.info.main : 'theme.palette.info.main',
            fill: 'none',
          },
        }}
        color="secondary"
      />
      <InputBase sx={{ width: '100%' }} placeholder={t`Search`} />
    </Box>
  );
}

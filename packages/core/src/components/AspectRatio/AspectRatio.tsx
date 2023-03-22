import { Box } from '@mui/material';
import React, { ReactNode } from 'react';

type Props = {
  ratio: number;
  children: ReactNode;
};

export default function AspectRatio(props: Props) {
  const { children, ratio } = props;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        display: 'flex',

        '&:before': {
          paddingBottom: () => `${(1 / ratio) * 100}}%`,
          content: '',
          float: 'left',
        },

        '&:after': {
          display: 'table',
          content: '',
          clear: 'both',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignContent: 'center',
          alignSelf: 'stretch',
          width: '100%',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

import { Box, LinearProgress, Typography } from '@mui/material';
import React, { ReactNode } from 'react';

import Flex from '../Flex';

type Props = {
  color: string;
  children?: ReactNode;
  progress?: number;
};

export default function PlotStatus(props: Props) {
  const { children, color, progress } = props;

  return (
    <Flex flexDirection="column" gap={1}>
      {progress !== undefined ? (
        <Flex gap={1} alignItems="center">
          <LinearProgress
            variant="determinate"
            value={progress * 100}
            color="secondary"
            sx={{
              height: '10px',
              width: '75px',
              borderRadius: '0',
            }}
          />
          <Flex>
            <Typography variant="body2" color="textSecondary">
              {`${Math.round(progress * 100)}%`}
            </Typography>
          </Flex>
        </Flex>
      ) : (
        <Box
          sx={{
            display: 'inline-block',
            height: '10px',
            width: '75px',
            backgroundColor: color,
          }}
        />
      )}

      <Flex>{children}</Flex>
    </Flex>
  );
}

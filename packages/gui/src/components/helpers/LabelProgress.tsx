import { Box, LinearProgress, type LinearProgressProps } from '@mui/material';
import React, { type ReactNode } from 'react';

type LabelProgressProps = LinearProgressProps & {
  value: number;
  children: ReactNode;
  hideValue?: boolean;
};

export default function LabelProgress(props: LabelProgressProps) {
  const { value, children, hideValue, ...rest } = props;

  return (
    <Box position="relative">
      {children}&nbsp;{!hideValue && `${Math.round(value)}%`}
      <Box sx={{ position: 'absolute', bottom: -5, left: 0, right: 0 }}>
        <LinearProgress variant="determinate" value={value} {...rest} sx={{ height: 3 }} />
      </Box>
    </Box>
  );
}

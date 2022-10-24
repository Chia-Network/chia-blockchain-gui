import React, { ReactNode, useRef } from 'react';
import { Box, Paper, Popper } from '@mui/material';
import { Typography } from '@mui/material';

export type WalletGraphTooltipProps = {
  x?: number;
  y?: number;
  suffix?: ReactNode;
  dotSize?: number;
  datum?: {
    tooltip: ReactNode;
  };
};

export default function WalletGraphTooltip(props: WalletGraphTooltipProps) {
  const {
    datum = { tooltip: '' },
    x = 0,
    y = 0,
    suffix = '',
    dotSize = 4,
  } = props;
  const elementRef = useRef<HTMLDivElement | null>(null);

  return (
    <g style={{ pointerEvents: 'none' }}>
      <foreignObject
        x={x - Math.floor(dotSize / 2)}
        y={y - Math.floor(dotSize / 2)}
        width={dotSize}
        height={dotSize}
      >
        <Box
          sx={{
            backgroundColor: '#5DAA62',
            width: dotSize,
            height: dotSize,
            borderRadius: 9999,
          }}
        />
        <Box ref={elementRef} />
        <Popper
          placement="bottom"
          anchorEl={elementRef.current}
          style={{ pointerEvents: 'none' }}
          open
        >
          <Paper
            sx={{
              paddingX: 1,
              paddingY: 0.25,
              marginY: 0.5,
            }}
          >
            <Typography variant="caption">{`${datum.tooltip} ${suffix}`}</Typography>
          </Paper>
        </Popper>
      </foreignObject>
    </g>
  );
}

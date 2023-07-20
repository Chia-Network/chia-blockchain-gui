import { Stack, type StackProps } from '@mui/material';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import React, { useEffect, useRef } from 'react';

export type FlexProps = StackProps & {
  flexDirection?: 'row' | 'column';
  inline?: boolean;
  overrideScrollbar?: boolean;
};

export default function Flex(props: FlexProps) {
  const { flexDirection = 'row', direction, inline, sx, overrideScrollbar, ...rest } = props;

  const ref = useRef();
  const [initialize] = useOverlayScrollbars({ defer: true });

  useEffect(() => {
    if (overrideScrollbar) {
      initialize(ref.current);
    }
  }, [initialize, overrideScrollbar]);

  const computedDirection = direction ?? flexDirection;

  return (
    <Stack
      direction={computedDirection}
      sx={{
        display: inline ? 'inline-flex' : 'flex',
        ...sx,
      }}
      {...rest}
      ref={ref}
    />
  );
}

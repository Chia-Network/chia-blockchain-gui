import { Stack, type StackProps } from '@mui/material';
import React, { forwardRef } from 'react';

export type FlexProps = StackProps & {
  flexDirection?: 'row' | 'column';
  inline?: boolean;
};

function Flex(props: FlexProps, ref: any) {
  const { flexDirection = 'row', direction, inline, sx, ...rest } = props;

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

export default forwardRef(Flex);

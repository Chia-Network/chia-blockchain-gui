import { Trans } from '@lingui/macro';
import { Box } from '@mui/material';
import React from 'react';

import StateColor from '../../constants/StateColor';
import Amount, { AmountProps } from '../Amount';

type FeeProps = AmountProps;

export default function Fee(props: FeeProps) {
  return (
    <Amount {...props}>
      {({ value, mojo }) => {
        const isHigh = mojo.gte('100000000000');
        const isLow = mojo.gt('0') && mojo.lt('1');

        if (!value) {
          return <Trans>Recommended value: 0.000005</Trans>;
        }

        if (isHigh) {
          return (
            <Box sx={{ color: () => StateColor.WARNING }}>
              <Trans>Value seems high</Trans>
            </Box>
          );
        }

        if (isLow) {
          return (
            <Box sx={{ color: () => StateColor.ERROR }}>
              <Trans>Incorrect value</Trans>
            </Box>
          );
        }

        return null;
      }}
    </Amount>
  );
}

Fee.defaultProps = {
  label: <Trans>Fee</Trans>,
  name: 'fee',
};

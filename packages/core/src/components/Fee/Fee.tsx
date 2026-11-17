import { Trans } from '@lingui/macro';
import { Box } from '@mui/material';
import type BigNumber from 'bignumber.js';
import React from 'react';

import useCurrencyCode from '../../hooks/useCurrencyCode';
import useLocale from '../../hooks/useLocale';
import { getStateColors } from '../../theme/semanticColors';
import mojoToChiaLocaleString from '../../utils/mojoToChiaLocaleString';
import Amount, { AmountProps } from '../Amount';
import { isMinimumFeeExpired } from '../EstimatedFee/minimumFee';

import getFeeWarning from './getFeeWarning';

type FeeProps = AmountProps & {
  minimumFee?: BigNumber; // in mojos, warns when the entered fee is lower
};

export default function Fee({ label = <Trans>Fee</Trans>, name = 'fee', minimumFee, ...props }: FeeProps) {
  const [locale] = useLocale();
  const currencyCode = useCurrencyCode();

  return (
    <Amount label={label} name={name} {...props}>
      {({ value, mojo }) => {
        const warning = getFeeWarning(mojo, minimumFee);

        // This value is below the minimum fee, so it is only recommended once the minimum expired.
        if (!value && isMinimumFeeExpired()) {
          return <Trans>Recommended value: 0.000005</Trans>;
        }

        if (warning === 'high') {
          return (
            <Box sx={{ color: (theme) => getStateColors(theme.palette).warning }}>
              <Trans>Value seems high</Trans>
            </Box>
          );
        }

        if (warning === 'incorrect') {
          return (
            <Box sx={{ color: (theme) => getStateColors(theme.palette).error }}>
              <Trans>Incorrect value</Trans>
            </Box>
          );
        }

        if (warning === 'belowMinimum' && minimumFee) {
          const formattedMinimumFee = mojoToChiaLocaleString(minimumFee, locale);

          return (
            <Box sx={{ color: (theme) => getStateColors(theme.palette).warning }}>
              <Trans>
                Below the recommended minimum of {formattedMinimumFee} {currencyCode}. Your transaction may not be
                confirmed.
              </Trans>
            </Box>
          );
        }

        return null;
      }}
    </Amount>
  );
}

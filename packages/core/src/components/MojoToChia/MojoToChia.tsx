import BigNumber from 'bignumber.js';
import React from 'react';

import useCurrencyCode from '../../hooks/useCurrencyCode';
import mojoToChia from '../../utils/mojoToChiaLocaleString';
import FormatLargeNumber from '../FormatLargeNumber';

export type MojoToChiaProps = {
  value: number | BigNumber;
};

export default function MojoToChia(props: MojoToChiaProps) {
  const { value } = props;
  const currencyCode = useCurrencyCode();
  const updatedValue = mojoToChia(value);

  return (
    <>
      <FormatLargeNumber value={updatedValue} />
      &nbsp;{currencyCode ?? ''}
    </>
  );
}

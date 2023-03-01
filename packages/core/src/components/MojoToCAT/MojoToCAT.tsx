import BigNumber from 'bignumber.js';
import React from 'react';

import mojoToCAT from '../../utils/mojoToCATLocaleString';
import FormatLargeNumber from '../FormatLargeNumber';

export type MojoToCATProps = {
  value: number | BigNumber;
  currencyCode: string;
};

export default function MojoToCAT(props: MojoToCATProps) {
  const { value, currencyCode } = props;
  const updatedValue = mojoToCAT(value);

  return (
    <>
      <FormatLargeNumber value={updatedValue} />
      &nbsp;{currencyCode}
    </>
  );
}

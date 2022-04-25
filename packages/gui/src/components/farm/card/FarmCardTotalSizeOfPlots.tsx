import React from 'react';
import { Trans } from '@lingui/macro';
import { FormatBytes, CardSimple } from '@chia/core';
// import usePlots from '../../../hooks/usePlots';

export default function FarmCardTotalSizeOfPlots() {
  // const { size } = 'N/A'; // usePlots();
  const size = 0;

  return (
    <CardSimple
      title={<Trans>Total Size of Plots</Trans>}
      value={'N/A'/*<FormatBytes value={size} precision={3} />*/}
    />
  );
}

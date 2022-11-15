import { useGetFarmedAmountQuery } from '@chia/api-react';
import { useCurrencyCode, mojoToChiaLocaleString, CardSimple, useLocale } from '@chia/core';
import { Trans } from '@lingui/macro';
import React, { useMemo } from 'react';

export default function FarmCardTotalChiaFarmed() {
  const currencyCode = useCurrencyCode();
  const [locale] = useLocale();
  const { data, isLoading, error } = useGetFarmedAmountQuery();

  const farmedAmount = data?.farmedAmount;

  const totalChiaFarmed = useMemo(() => {
    if (farmedAmount !== undefined) {
      return (
        <>
          {mojoToChiaLocaleString(farmedAmount, locale)}
          &nbsp;
          {currencyCode}
        </>
      );
    }
  }, [farmedAmount, locale, currencyCode]);

  return (
    <CardSimple
      title={<Trans>Total Chia Farmed</Trans>}
      value={totalChiaFarmed}
      loading={isLoading}
      error={error}
    />
  );
}

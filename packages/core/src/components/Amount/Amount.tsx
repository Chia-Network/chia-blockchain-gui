import { Trans, Plural } from '@lingui/macro';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Box, IconButton, InputAdornment, FormControl, FormHelperText } from '@mui/material';
import BigNumber from 'bignumber.js';
import React, { type ReactNode } from 'react';
import { useWatch, useFormContext } from 'react-hook-form';

import useCurrencyCode from '../../hooks/useCurrencyCode';
import catToMojo from '../../utils/catToMojo';
import chiaToMojo from '../../utils/chiaToMojo';
import Flex from '../Flex';
import FormatLargeNumber from '../FormatLargeNumber';
import TextField, { TextFieldProps } from '../TextField';
import NumberFormatCustom from './NumberFormatCustom';

export type AmountProps = TextFieldProps & {
  children?: (props: { mojo: BigNumber; value: string | undefined }) => ReactNode;
  name?: string;
  symbol?: string; // if set, overrides the currencyCode. empty string is allowed
  showAmountInMojos?: boolean; // if true, shows the mojo amount below the input field
  dropdownAdornment?: func;
  // feeMode?: boolean; // if true, amounts are expressed in mojos used to set a transaction fee
  'data-testid'?: string;
};

export default function Amount(props: AmountProps) {
  const {
    children,
    name,
    symbol,
    showAmountInMojos,
    dropdownAdornment,
    variant,
    fullWidth,
    'data-testid': dataTestid,
    ...rest
  } = props;
  const { control } = useFormContext();
  const defaultCurrencyCode = useCurrencyCode();

  const value = useWatch<string>({
    control,
    name,
  });

  const correctedValue = value && value[0] === '.' ? `0${value}` : value;

  const currencyCode = symbol === undefined ? defaultCurrencyCode : symbol;
  const isChiaCurrency = ['XCH', 'TXCH'].includes(currencyCode);
  const mojo = isChiaCurrency ? chiaToMojo(correctedValue) : catToMojo(correctedValue);

  return (
    <FormControl variant={variant} fullWidth={fullWidth}>
      <TextField
        name={name}
        variant={variant}
        autoComplete="off"
        InputProps={{
          spellCheck: false,
          inputComponent: NumberFormatCustom as any,
          inputProps: {
            decimalScale: isChiaCurrency ? 12 : 3,
            'data-testid': dataTestid,
          },
          endAdornment: dropdownAdornment ? (
            <IconButton onClick={dropdownAdornment}>
              <ArrowDropDownIcon />
            </IconButton>
          ) : (
            <InputAdornment position="end">{currencyCode}</InputAdornment>
          ),
          style: dropdownAdornment ? { paddingRight: '0' } : undefined,
        }}
        {...rest}
      />
      <FormHelperText component="div">
        <Flex alignItems="center" gap={2}>
          {showAmountInMojos && (
            <Flex flexGrow={1} gap={1}>
              {!mojo.isZero() && (
                <>
                  <FormatLargeNumber value={mojo} />
                  <Box>
                    <Plural value={mojo.toNumber()} one="mojo" other="mojos" />
                  </Box>
                </>
              )}
            </Flex>
          )}
          {children &&
            children({
              mojo,
              value,
            })}
        </Flex>
      </FormHelperText>
    </FormControl>
  );
}

Amount.defaultProps = {
  label: <Trans>Amount</Trans>,
  name: 'amount',
  children: undefined,
  showAmountInMojos: true,
  // feeMode: false,
};

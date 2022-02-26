import React, { ReactNode } from 'react';
import { Trans, Plural } from '@lingui/macro';
import NumberFormat from 'react-number-format';
import {
  Box,
  InputAdornment,
  FormControl,
  FormHelperText,
} from '@material-ui/core';
import { useWatch, useFormContext } from 'react-hook-form';
import TextField, { TextFieldProps } from '../TextField';
import chiaToMojo from '../../utils/chiaToMojo';
import catToMojo from '../../utils/catToMojo';
import useCurrencyCode from '../../hooks/useCurrencyCode';
import FormatLargeNumber from '../FormatLargeNumber';
import Flex from '../Flex';

interface NumberFormatCustomProps {
  inputRef: (instance: HTMLInputElement | null) => void;
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

type NumberFormatValuesType = {
  formattedValue: string;
  value: string;
  floatValue: number|undefined;
};

function isValueAllowed(values: NumberFormatValuesType){
  // Absolute value of Amount/Fee must be less than MAX_SAFE_INTEGER
  const canBigIntBeConstructed = /^[0-9]+$/.test(values.value);
  if(canBigIntBeConstructed){
    const N = BigInt(values.value);
    if(N > BigInt(Number.MAX_SAFE_INTEGER) || N < 0){
      return false;
    }
    if(/^00/.test(values.value)){
      return false;
    }
  }

  // Do not allow non-numeric string. But strings like below are OK.
  //   .  =>  This leads to decimal like .123456
  const cannotConstructNumberAnyMore = (
    isNaN(+values.value)
    && !(/^\.[0-9]*$/.test(values.value))
  );
  if(cannotConstructNumberAnyMore){
    return false;
  }

  // Negative number is not allowed
  const isNegative = values.value.charAt(0) === "-";
  if(isNegative){
    return false;
  }

  // Check fraction part of double precision floating point
  // e.g. The fraction part of 90071992.54740991 is 53 bit,
  // which is beyond the specification(52 bit) so it should be an error.
  const normalizedValue = values.value
    // .123 => 0.123
    .replace(/^\./, "0.")
    // 0. => 0 ; 0.00 => 0
    .replace(/^0\.0*$/, "0")
    // 12. => 12
    .replace(/([0-9])\.$/, "$1")
    // 0.123000 => 0.123
    .replace(/([1-9]+)0+$/, "$1")
    // 0.000000123 => 123
    // Because for example (0.0000001).toString() will be '1e-7' (not "0.0000001")
    // and this exponential style stringification makes validation below not working
    .replace(/^0\.0{6,}/, "")
  ;
  const fractionOverflow =
    !canBigIntBeConstructed
    && values.value !== ""
    && (+normalizedValue).toString() !== normalizedValue;
  return !fractionOverflow;
}

function NumberFormatCustom(props: NumberFormatCustomProps) {
  const { inputRef, onChange, ...other } = props;

  function handleChange(values: NumberFormatValuesType) {
    onChange({target: {name: props.name, value: values.value}});
  }

  return (
    <NumberFormat
      {...other}
      getInputRef={inputRef}
      onValueChange={handleChange}
      thousandSeparator
      allowNegative={false}
      isNumericString
      isAllowed={isValueAllowed}
    />
  );
}

export type AmountProps = TextFieldProps & {
  children?: (props: { mojo: number; value: string | undefined }) => ReactNode;
  name?: string;
  symbol?: string; // if set, overrides the currencyCode. empty string is allowed
  showAmountInMojos?: boolean; // if true, shows the mojo amount below the input field
  feeMode?: boolean // if true, amounts are expressed in mojos used to set a transaction fee
};

export default function Amount(props: AmountProps) {
  const { children, name, symbol, showAmountInMojos, variant, fullWidth, ...rest } = props;
  const { control } = useFormContext();
  const defaultCurrencyCode = useCurrencyCode();

  const value = useWatch<string>({
    control,
    name,
  });

  const correctedValue = value[0] === '.' ? `0${value}` : value;

  const currencyCode = symbol === undefined ? defaultCurrencyCode : symbol;
  const isChiaCurrency = ['XCH', 'TXCH'].includes(currencyCode);
  const mojo = isChiaCurrency
    ? chiaToMojo(correctedValue)
    : catToMojo(correctedValue);

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
          },
          endAdornment: (
            <InputAdornment position="end">{currencyCode}</InputAdornment>
          ),
        }}
        {...rest}
      />
        <FormHelperText component='div' >
          <Flex alignItems="center" gap={2}>
            {showAmountInMojos && (
              <Flex flexGrow={1} gap={1}>
                {!!mojo && (
                  <>
                    <FormatLargeNumber value={mojo} />
                    <Box>
                      <Plural value={mojo} one="mojo" other="mojos" />
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
  feeMode: false,
};

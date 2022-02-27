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
import Unit from '../../constants/Unit';
import chiaFormatter from '../../utils/chiaFormatter';

interface NumberFormatCustomProps {
  inputRef: (instance: HTMLInputElement | null) => void;
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
  isAllowed: (values: NumberFormatValuesType) => boolean;
}

type NumberFormatValuesType = {
  formattedValue: string;
  value: string;
  floatValue: number|undefined;
};

function checkFloatingPrecision(numStr: string, isChiaCurrency: boolean){
  try{
    const mojo = isChiaCurrency ?
      chiaFormatter(numStr, Unit.CHIA).to(Unit.MOJO)
      : chiaFormatter(numStr, Unit.CAT).to(Unit.MOJO)
    ;
    mojo.toNumber();
    return true;
  }
  catch(e){
    console.warn(e);
    return false;
  }
}

function generateFilter(isChiaCurrency: boolean){
  return function isValueAllowed(values: NumberFormatValuesType){
    let value = values.value
      // .123 => 0.123
      .replace(/^\./, "0.")
      // 0. => 0 ; 0.00 => 0, 14.0 => 14
      .replace(/^([0-9]*)\.0*$/, "$1")
      // 12. => 12
      .replace(/([0-9])\.$/, "$1")
    ;

    // Do not allow non-numeric string. But strings like below are OK.
    //   .  =>  This leads to decimal like .123456
    const cannotConstructNumberAnyMore = (
      isNaN(+value)
      && !(/^\.[0-9]*$/.test(value))
    );
    if(cannotConstructNumberAnyMore){
      return false;
    }

    // Negative number is not allowed
    const isNegative = value.charAt(0) === "-";
    if(isNegative){
      return false;
    }

    // Number like 0011232 is not allowed
    if(/^0[0-9]/.test(value)){
      return false;
    }

    // Check fraction part of double precision floating point
    // e.g. The fraction part of 90071992.54740991 is 53 bit,
    // which is beyond the specification(52 bit) so it should be an error.
    const fractionOverflow =
      value !== ""
      && !checkFloatingPrecision(value, isChiaCurrency);
    return !fractionOverflow;
  };
}

function NumberFormatCustom(props: NumberFormatCustomProps) {
  const { inputRef, onChange, isAllowed, ...other } = props;

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
      isAllowed={isAllowed}
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

  const value = useWatch({
    control,
    name,
  });

  const correctedValue = value[0] === '.' ? `0${value}` : value;

  const currencyCode = symbol === undefined ? defaultCurrencyCode : symbol;
  const isChiaCurrency = ['XCH', 'TXCH'].includes(currencyCode || "");
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
            isAllowed: generateFilter(isChiaCurrency),
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

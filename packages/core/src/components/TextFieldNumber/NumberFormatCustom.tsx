import React, { forwardRef } from 'react';
import { NumericFormat, type OnValueChange } from 'react-number-format';

interface NumberFormatCustomProps {
  inputRef: (instance: typeof NumericFormat | null) => void;
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

function NumberFormatCustom(props: NumberFormatCustomProps) {
  const { inputRef, onChange, ...other } = props;

  const handleChange: OnValueChange = React.useCallback(
    (values) => {
      onChange(values.value);
    },
    [onChange],
  );

  return (
    <NumericFormat
      {...other}
      getInputRef={inputRef}
      onValueChange={handleChange}
      thousandSeparator
      allowNegative={false}
      valueIsNumericString
    />
  );
}

export default forwardRef(NumberFormatCustom);

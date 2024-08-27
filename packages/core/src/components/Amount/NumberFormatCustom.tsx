import React, { forwardRef } from 'react';
import { NumericFormat, type OnValueChange } from 'react-number-format';

interface NumberFormatCustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

function NumberFormatCustom(props: NumberFormatCustomProps, ref: any) {
  const { onChange, ...other } = props;

  const handleChange: OnValueChange = React.useCallback(
    (values) => {
      onChange(values.value);
    },
    [onChange],
  );

  return (
    <NumericFormat
      {...other}
      getInputRef={ref}
      onValueChange={handleChange}
      thousandSeparator
      allowNegative={false}
      valueIsNumericString
    />
  );
}

export default forwardRef(NumberFormatCustom);

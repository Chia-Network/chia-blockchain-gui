import { Checkbox as MaterialCheckbox, type CheckboxProps as BaseCheckboxProps } from '@mui/material';
import React, { ChangeEvent, type ReactNode, forwardRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

function ParseBoolean(props: CheckboxProps) {
  const { onChange, value, ...rest } = props;
  const { name } = rest;
  const { setValue } = useFormContext();

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const checked = Boolean(e.target.checked);
    // @ts-ignore
    onChange(e, checked);

    if (name) {
      setValue(name, checked);
    }
  }

  return <MaterialCheckbox onChange={handleChange} checked={value} {...rest} />;
}

export type CheckboxProps = BaseCheckboxProps & {
  name: string;
  label?: ReactNode;
  value: boolean;
};

function Checkbox(props: CheckboxProps, ref: any) {
  const { name, ...rest } = props;
  const { control, getValues } = useFormContext();

  return (
    // @ts-ignore
    <Controller
      name={name}
      control={control}
      render={({ field }) => <ParseBoolean {...field} {...rest} value={Boolean(getValues(name))} ref={ref} />}
    />
  );
}

export default forwardRef(Checkbox);

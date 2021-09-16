import React from 'react';
import { get } from 'lodash';
import { Controller, useFormContext } from 'react-hook-form';
import { Select as MaterialSelect, SelectProps } from '@material-ui/core';

type Props = SelectProps & {
  hideError?: boolean;
  name: string;
};

export default function Select(props: Props) {
  const { name, onChange, ...rest } = props;
  const { control, errors } = useFormContext();
  const errorMessage = get(errors, name);

  const handleChange = () => {
    console.log("handle change called in Select.tsx");
  };

  return (
    // @ts-ignore
    <Controller
      onChange={handleChange}
      as={MaterialSelect}
      name={name}
      control={control}
      render={({ field }) => (<MaterialSelect {...field} error={!!errorMessage}  {...rest} /> )}
    />
  );
}

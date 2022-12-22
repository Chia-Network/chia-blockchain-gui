import { TextField as MaterialTextField, TextFieldProps as MaterialTextFieldProps } from '@mui/material';
import React, { ReactElement, ReactNode } from 'react';
import { Controller, ControllerProps, useFormContext } from 'react-hook-form';

export type ReactRules<T> =
  | ControllerProps<ReactElement<T>>['rules']
  | {
      min?:
        | number
        | string
        | {
            value: number;
            message: ReactNode;
          };
      max?:
        | number
        | string
        | {
            value: number;
            message: ReactNode;
          };
      minLength?:
        | number
        | string
        | {
            value: number;
            message: ReactNode;
          };
      maxLength?:
        | number
        | string
        | {
            value: number;
            message: ReactNode;
          };
      required?:
        | boolean
        | {
            value: boolean;
            message: ReactNode;
          };
    };

export type TextFieldProps = MaterialTextFieldProps & {
  hideError?: boolean;
  name: string;
  rules?: ReactRules<typeof MaterialTextField>;
  'data-testid'?: string;
};

/**
 * Convert original form rules to `react-hook-form` compatible rules.
 */
function normalizeRules<T>(rules?: ReactRules<T>): ControllerProps<ReactElement<T>>['rules']|undefined {
  if(!rules){
    return undefined;
  }
  
  const newRules: ControllerProps<ReactElement<T>>['rules'] = {};
  
  if(typeof rules.min === 'object' && rules.min.value !== undefined){
    newRules.min = rules.min.value;
  } else if(typeof rules.min === 'number' || typeof rules.min === 'string'){
    newRules.min = rules.min;
  }
  if (typeof rules.max === 'object' && rules.max.value !== undefined) {
    newRules.max = rules.max.value;
  } else if (typeof rules.max === 'number' || typeof rules.max === 'string') {
    newRules.max = rules.max;
  }
  if (typeof rules.minLength === 'object' && rules.minLength.value !== undefined) {
    newRules.minLength = rules.minLength.value;
  } else if (typeof rules.minLength === 'number') {
    newRules.minLength = rules.minLength;
  }
  if (typeof rules.maxLength === 'object' && rules.maxLength.value !== undefined) {
    newRules.maxLength = rules.maxLength.value;
  } else if (typeof rules.maxLength === 'number') {
    newRules.maxLength = rules.maxLength;
  }
  if (typeof rules.required === 'object' && rules.required.value !== undefined) {
    newRules.required = rules.required.value;
  } else if (typeof rules.required === 'number' || typeof rules.required === 'string') {
    newRules.required = rules.required;
  }
  
  return newRules;
}

type ErrorType = "min" | "max" | "minLength" | "maxLength" | "required";

export default function TextField(props: TextFieldProps): JSX.Element {
  const {
    name,
    onChange: baseOnChange,
    'data-testid': dataTestid,
    inputProps,
    rules,
    helperText,
    ...rest
  } = props;
  const { control, formState: {errors} } = useFormContext();
  const normalizedRules = React.useMemo(() => normalizeRules(rules), [rules]);
  const render = React.useCallback(({ field: { onChange, value } }) => {
    function handleChange(...args) {
      onChange(...args);
      if (baseOnChange) {
        baseOnChange(...args);
      }
    }
  
    let errorMsg: ReactNode | undefined;
    const error = errors ? (errors[name] as { type: ErrorType } | undefined) : undefined;
    if(!helperText){
      const errorType = error ? (error.type as ErrorType) : undefined;
      if (errorType && rules) {
        const rule = rules[errorType];
        if (rule && typeof rule === 'object') {
          errorMsg = rule.message;
        }
      }
    }
  
    return (
      <MaterialTextField
        value={value}
        onChange={handleChange}
        inputProps={{
          'data-testid': dataTestid,
          ...inputProps,
        }}
        error={Boolean(error)}
        helperText={helperText || errorMsg}
        {...rest}
      />
    );
  }, [baseOnChange, name, dataTestid, inputProps, rest, rules, errors, helperText]);
  
  return (
    <Controller
      name={name}
      control={control}
      rules={normalizedRules}
      render={render}
    />
  );
}

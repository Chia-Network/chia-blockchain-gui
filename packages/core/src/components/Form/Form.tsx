import React, { forwardRef, ReactNode, useState } from 'react';
import { UseFormMethods, FormProvider, SubmitHandler } from 'react-hook-form';
import useShowError from '../../hooks/useShowError';

function Form<T>(
  props: {
    methods: UseFormMethods<T>;
    onSubmit: SubmitHandler<T>;
    children: ReactNode;
  },
  ref: any
) {
  const { methods, onSubmit, ...rest } = props;
  const { handleSubmit } = methods;
  const showError = useShowError();
  const [loading, setLoading] = useState<boolean>(false);

  async function processSubmit(...args) {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      await onSubmit(...args);
    } catch (error: any) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(processSubmit)} {...rest} ref={ref} />
    </FormProvider>
  );
}

export default forwardRef(Form);

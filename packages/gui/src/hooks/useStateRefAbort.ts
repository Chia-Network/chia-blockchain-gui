import { useRef, useCallback, useState } from 'react';

export default function useStateRefAbort<T = undefined>(initialValue: T | (() => T)) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef(value);

  const handleSetValue = useCallback((newValue: T | ((oldValue: T) => T), signal?: AbortSignal) => {
    if (signal?.aborted) {
      return;
    }

    setValue((oldValue) => {
      const updatedValue = typeof newValue === 'function' ? newValue(oldValue) : newValue;
      ref.current = updatedValue;
      return updatedValue;
    });
  }, []);

  return [value, handleSetValue, ref] as const;
}

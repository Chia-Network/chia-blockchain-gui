import { useState, useCallback } from 'react';

export default function useStateAbort<T = undefined>(initialValue: T) {
  const [value, setValue] = useState(initialValue);

  const handleSetValue = useCallback((newValue: Parameters<typeof setValue>[0], signal?: AbortSignal) => {
    if (signal?.aborted) {
      return;
    }

    setValue(newValue);
  }, []);

  return [value, handleSetValue] as const;
}

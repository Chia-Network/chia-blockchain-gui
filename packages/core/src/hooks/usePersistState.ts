import { useCallback, useContext } from 'react';
import { useUpdate } from 'react-use';

import { PersistContext } from '../components/Persist';

export default function usePersistState<T>(defaultValue: T, namespace?: string): [T, (value: T) => void] {
  const persistContext = useContext(PersistContext);
  const update = useUpdate();

  const value = namespace && persistContext ? persistContext.getValue(defaultValue, namespace) : defaultValue;

  const setValue = useCallback(
    (valueLocal: T) => {
      if (namespace && persistContext) {
        persistContext.setValue(valueLocal, namespace);
      }

      update();
    },
    [namespace, persistContext, update]
  );

  return [value, setValue];
}

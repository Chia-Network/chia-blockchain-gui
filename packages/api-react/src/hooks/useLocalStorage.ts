import { useState, useCallback, useEffect } from 'react';

import EventEmitter from '../utils/EventEmitter';

const eventEmitter = new EventEmitter();

type EventEmitterValue = { key: any; newValue: any };

function getValueFromLocalStorage<T>(key: string): T | undefined {
  const item = window.localStorage.getItem(key);

  if (item === undefined || item === null) {
    return undefined;
  }

  try {
    return JSON.parse(item);
  } catch (error) {
    return undefined;
  }
}

export default function useLocalStorage<T>(
  key: string,
  defaultValue?: T
): [T | undefined, (value: T | ((value: T | undefined) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T | undefined>(getValueFromLocalStorage(key));

  const setValue = useCallback(
    (value: T | ((nv: T | undefined) => T)) => {
      setStoredValue((currentStoredValue) => {
        const newValue = value instanceof Function ? value(currentStoredValue) : value;

        const newStoredValue = JSON.stringify(newValue);
        const oldStoredValue = JSON.stringify(currentStoredValue);
        if (newStoredValue === oldStoredValue) {
          return currentStoredValue;
        }

        window.localStorage.setItem(key, newStoredValue);
        eventEmitter.emit('storage', { key, newValue } as EventEmitterValue);

        return newValue;
      });
    },
    [key]
  );

  const changeHandler = useCallback(
    (e: EventEmitterValue) => {
      const { key: changeKey, newValue } = e;
      if (key === changeKey) {
        setStoredValue(newValue);
      }
    },
    [key]
  );

  // Listen changes
  useEffect(() => {
    eventEmitter.on('storage', changeHandler);
    return () => {
      eventEmitter.remove('storage', changeHandler);
    };
  }, [changeHandler]);

  return [storedValue ?? defaultValue, setValue];
}

import { useState, useCallback, useEffect, useRef } from 'react';

import EventEmitter from '../utils/EventEmitter';
import { isEqual } from './usePrefs';

const eventEmitter = new EventEmitter();

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

export default function useLocalStorage<T extends keyof (string | undefined)>(
  key: string,
  defaultValue?: T
): [T | undefined, (value: T | ((value: T | undefined) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T | undefined>(getValueFromLocalStorage(key));
  const defaultValueRef = useRef(defaultValue);

  if (!isEqual(defaultValueRef.current, defaultValue)) {
    defaultValueRef.current = defaultValue;
  }

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
        eventEmitter.emit('storage', { key, newValue });

        return newValue;
      });
    },
    [key]
  );

  const changeHandler = useCallback(
    (e) => {
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

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
  const localStorageValue: T | undefined = getValueFromLocalStorage(key);
  const [useDefaultValue, setUseDefaultValue] = useState(localStorageValue === undefined);
  const [storedValue, setStoredValue] = useState<T | undefined>(localStorageValue);
  const defaultValueRef = useRef(defaultValue);

  if (!isEqual(defaultValueRef.current, defaultValue)) {
    defaultValueRef.current = defaultValue;
  }

  const setValue = useCallback(
    (value: T | ((nv: T | undefined) => T)) => {
      setStoredValue((currentStoredValue) => {
        let currentValue = currentStoredValue;

        // If the current value is undefined, and the initial value was undefined,
        // we'll override with the default value. We only do this once, so that we
        // allow the user to set the value to undefined from a previous value.
        if (currentValue === undefined && useDefaultValue) {
          currentValue = defaultValueRef.current;
          setUseDefaultValue(false);
        }

        const newValue = value instanceof Function ? value(currentValue) : value;

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
    [key, setStoredValue, defaultValueRef, useDefaultValue, setUseDefaultValue]
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

  return [storedValue ?? defaultValueRef.current, setValue];
}

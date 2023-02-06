import { useCallback, useEffect, useState, useRef } from 'react';

import EventEmitter from '../utils/EventEmitter';

const eventEmitter = new EventEmitter();

export type Serializable =
  | undefined
  | number
  | string
  | null
  | boolean
  | { [k: string]: Serializable }
  | Serializable[];

function getPreferences(key: string) {
  const { preferences } = window as any;
  return preferences?.[key];
}

function setPreferences(key: string, value: Serializable) {
  const { preferences } = window as any;
  (window as any).ipcRenderer.invoke('savePrefs', {
    ...preferences,
    [key]: value,
  });

  (window as any).preferences[key] = value;
}

export function isEqual(a: Serializable, b: Serializable) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function usePrefs<T extends Serializable>(
  key: string,
  defaultValue: T
): [T, (value: T | ((value: T) => T)) => void] {
  const [value, setValue] = useState<T>(getPreferences(key));
  const valueRef = useRef(value);
  valueRef.current = value;

  const defaultValueRef = useRef(defaultValue);

  if (!isEqual(defaultValueRef.current, defaultValue)) {
    defaultValueRef.current = defaultValue;
  }

  const handleSetValue = useCallback(
    (newValueOrFn: T | ((nv: T | undefined) => T)) => {
      const currentValue = valueRef.current ?? defaultValueRef.current;
      const newValue = newValueOrFn instanceof Function ? newValueOrFn(currentValue) : newValueOrFn;
      if (isEqual(currentValue, newValue)) {
        return;
      }

      if (isEqual(newValue, defaultValueRef.current)) {
        setPreferences(key, undefined);
        eventEmitter.emit('prefs', { key, newValue: undefined });
        return;
      }

      setPreferences(key, newValue);

      // notify other hooks
      eventEmitter.emit('prefs', { key, newValue });
    },
    [key]
  );

  const handleOnChange = useCallback(
    (e: { key: string; newValue: T }) => {
      if (key === e.key) {
        setValue(e.newValue);
      }
    },
    [key]
  );

  // The reason to use EventEmitter for updating prefs state:
  // Without using 'global' event handler, usePrefs is just the local, component wide
  // state manager, which means `setPrefStateValue` does not propagate to other component states.
  // By EventEmitter, state update from one component triggers `setPrefStateValue` of other components
  // which has the same preference key.
  useEffect(() => {
    eventEmitter.on('prefs', handleOnChange);
    return () => {
      eventEmitter.remove('prefs', handleOnChange);
    };
  }, [handleOnChange]);

  return [(valueRef.current ?? defaultValueRef.current) as T, handleSetValue];
}

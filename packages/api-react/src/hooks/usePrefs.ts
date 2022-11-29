import { useCallback, useEffect, useState } from 'react';
import EventEmitter from '../utils/EventEmitter';

const eventEmitter = new EventEmitter();

function maybeEqual(objA: any, objB: any){
  // This does not consider object property ordering, so it's "maybe" equal.
  return JSON.stringify(objA) === JSON.stringify(objB);
}

export type Serializable = number
  | string
  | null
  | boolean
  | { [k: string ]: Serializable }
  | Serializable[]
;

export default function usePrefs<T extends Serializable>(
  key: string,
  initialValue?: T
): [T | undefined, (value: T | ((value: T | undefined) => T)) => void] {
  const prefsInRAM = (window as any).preferences;
  const currentPrefValue = prefsInRAM[key] === undefined
    ? initialValue : prefsInRAM[key];
  const [prefStateValue, setPrefStateValue] = useState<T | undefined>(currentPrefValue);

  const setPrefValue = useCallback(
    (valueOrFunc: T | ((value: T | undefined) => T)) => {
      const newPrefValue = valueOrFunc instanceof Function ? valueOrFunc(prefStateValue) : valueOrFunc;
      if(maybeEqual(newPrefValue, currentPrefValue)){
        return;
      }

      (window as any).preferences[key] = newPrefValue;
      (window as any).ipcRenderer.invoke('savePrefs', (window as any).preferences);

      eventEmitter.emit('prefs', { key, newValue: newPrefValue });
    },
    [prefStateValue, currentPrefValue, key],
  );

  const changeHandler = useCallback(
    (e: {key: string; newValue: any}) => {
      if (key === e.key) {
        setPrefStateValue(e.newValue);
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
    eventEmitter.on('prefs', changeHandler);
    return () => {
      eventEmitter.remove('prefs', changeHandler);
    };
  }, [changeHandler]);

  return [prefStateValue, setPrefValue];
}

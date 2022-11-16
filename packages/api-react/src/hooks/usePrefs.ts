import { useCallback, useState } from 'react';

function deepEqual(objA: any, objB: any){
  return JSON.stringify(objA) === JSON.stringify(objB);
}

export default function usePrefs<T>(
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
      if(deepEqual(newPrefValue, currentPrefValue)){
        return;
      }

      setPrefStateValue(newPrefValue);
      (window as any).preferences[key] = newPrefValue;
      (window as any).ipcRenderer.invoke('savePrefs', (window as any).preferences);
    },
    [prefStateValue, currentPrefValue, key],
  );

  return [prefStateValue, setPrefValue];
}

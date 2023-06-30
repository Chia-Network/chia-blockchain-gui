import { useCallback } from 'react';

import usePrefs, { type Serializable } from './usePrefs';

export default function useFingerprintSettings<Type extends Serializable>(
  fingerprint: number | undefined,
  key: string,
  defaultValue?: Type
): [Type | undefined, (value: Type | ((preValue: Type) => Type)) => void] {
  type LocalStorageType = Record<string, Record<string, Serializable>>;
  const [settings, setSettings] = usePrefs<LocalStorageType>('fingerprintSettings', {});

  const setValue = useCallback(
    (newValue: Type | ((preValue: Type) => Type)) => {
      if (!fingerprint) {
        throw new Error('Fingerprint is not defined');
      }

      setSettings((prevSettings) => {
        const fingerprintSettings = prevSettings?.[fingerprint] ?? {};

        const newComputedValue = typeof newValue === 'function' ? newValue(fingerprintSettings[key] as Type) : newValue;

        if (newComputedValue === undefined) {
          const newSettings = { ...fingerprintSettings };
          delete newSettings[key];

          return {
            ...prevSettings,
            [fingerprint]: newSettings,
          };
        }

        return {
          ...prevSettings,
          [fingerprint]: {
            ...fingerprintSettings,
            [key]: newComputedValue,
          },
        };
      });
    },
    [key, setSettings, fingerprint]
  );

  if (!fingerprint) {
    return [defaultValue, setValue];
  }

  return [(settings[fingerprint]?.[key] as Type) ?? defaultValue, setValue];
}

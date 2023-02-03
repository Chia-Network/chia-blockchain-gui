import { useCallback, useRef } from 'react';

import usePrefs, { type Serializable } from './usePrefs';

export default function useFingerprintSettings<Type extends Serializable>(
  fingerprint: number | undefined,
  key: string,
  defaultValue?: Type
): [Type | undefined, (value: Type) => void] {
  type LocalStorageType = Record<string, Record<string, Serializable>>;
  const [settings, setSettings] = usePrefs<LocalStorageType>('fingerprintSettings', {});
  const refSettings = useRef(settings);
  refSettings.current = settings;

  const setValue = useCallback(
    (newValue: Type) => {
      if (!fingerprint) {
        throw new Error('Fingerprint is not defined');
      }

      const currentSettings = refSettings.current;
      const currentFingerprintSettings = currentSettings?.[fingerprint] ?? {};

      if (newValue === undefined) {
        const newSettings = { ...currentFingerprintSettings };
        delete newSettings[key];

        setSettings({
          ...currentSettings,
          [fingerprint]: newSettings,
        });
      } else {
        setSettings({
          ...currentSettings,
          [fingerprint]: {
            ...currentFingerprintSettings,
            [key]: newValue,
          },
        });
      }
    },
    [key, setSettings, fingerprint]
  );

  if (!fingerprint) {
    return [defaultValue, setValue];
  }

  return [settings[fingerprint]?.[key] ?? defaultValue, setValue];
}

import useLocalStorage from './useLocalStorage';

export default function useFingerprintSettings<Type>(
  fingerprint: number | undefined,
  key: string,
  defaultValue?: Type
): [Type | undefined, (value: Type) => void] {
  type LocalStorageType = Record<string, Record<string, any> | undefined>;
  const [fingerprintSettings, setFingerprintSettings] =
    useLocalStorage<LocalStorageType>('fingerprintSettings', {});

  if (fingerprint === undefined) {
    return [
      undefined,
      () => {
        throw new Error('Fingerprint is not defined');
      },
    ];
  }

  const settings = fingerprintSettings?.[fingerprint] ?? {};
  const value = settings[key] ?? defaultValue;

  function setValue(value: Type | undefined) {
    if (value === undefined) {
      const newSettings = { ...settings };
      delete newSettings[key];

      setFingerprintSettings({
        ...fingerprintSettings,
        [fingerprint as number]: newSettings,
      });
    } else {
      setFingerprintSettings({
        ...fingerprintSettings,
        [fingerprint as number]: {
          ...settings,
          [key]: value,
        },
      });
    }
  }

  return [value, setValue];
}

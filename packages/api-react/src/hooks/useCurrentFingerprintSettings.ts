import { useGetLoggedInFingerprintQuery } from '../services/wallet';
import useFingerprintSettings from './useFingerprintSettings';
import { type Serializable } from './usePrefs';

export default function useCurrentFingerprintSettings<Type extends Serializable>(
  key: string,
  defaultValue?: Type
): [
  Type | undefined,
  (value: Type) => void,
  {
    fingerprint: number | undefined;
    isLoading: boolean;
    error?: unknown;
  }
] {
  const { data: fingerprint, isLoading, error } = useGetLoggedInFingerprintQuery();
  const [data, setData] = useFingerprintSettings<Type>(fingerprint, key, defaultValue);

  return [
    data,
    setData,
    {
      isLoading,
      error,
      fingerprint,
    },
  ];
}

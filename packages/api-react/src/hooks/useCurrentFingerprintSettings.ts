import { useGetLoggedInFingerprintQuery } from '../services/wallet';
import useFingerprintSettings from './useFingerprintSettings';

export default function useCurrentFingerprintSettings<Type>(
  key: string,
  defaultValue?: Type
): [
  Type | undefined,
  (value: Type) => void,
  {
    fingerprint: number | undefined;
    isLoading: boolean;
    error?: Error;
  }
] {
  const {
    data: fingerprint,
    isLoading,
    error,
  } = useGetLoggedInFingerprintQuery();

  const [data, setData] = useFingerprintSettings<Type>(
    fingerprint,
    key,
    defaultValue
  );

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

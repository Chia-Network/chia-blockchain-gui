import useCurrentFingerprintSettings from './useCurrentFingerprintSettings';

export default function useGetLocalCatName(
  assetId?: string,
  defaultName?: string
) {
  const [names, setNames] = useCurrentFingerprintSettings<
    Record<string, string | undefined>
  >('names', {});

  function setName(name: string) {
    if (!assetId) {
      throw new Error('Asset ID is not defined');
    }

    if (!name) {
      const newNames = { ...names };
      delete newNames[assetId];

      setNames(newNames);
    } else {
      setNames({
        ...names,
        [assetId]: name,
      });
    }
  }

  const name = assetId ? names?.[assetId] ?? defaultName : undefined;

  return [name, setName];
}

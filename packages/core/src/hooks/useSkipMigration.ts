import { usePrefs } from '@chia/api-react';

export default function useSkipMigration(): [boolean, (skip: boolean) => void] {
  const [skip, setSkip] = usePrefs<boolean>('skipMigration', false);

  return [skip, setSkip];
}

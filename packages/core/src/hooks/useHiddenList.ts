import { useLocalStorage } from '@chia/api-react';
import { useCallback, useMemo } from 'react';

type List<Type> = {
  [key: string]: Type[];
};

export default function useHiddenList<Type>(
  listName: string
): [
  isHidden: (key: Type) => boolean,
  setIsHidden: (key: Type, newValue: (isHidden: boolean) => boolean | boolean) => void,
  hidden: Type[]
] {
  const [hiddenLists, setHiddenLists] = useLocalStorage<List<Type>>('isHidden', {});

  const list = useMemo(() => (hiddenLists[listName] ? [...hiddenLists[listName]] : []), [hiddenLists, listName]);

  const handleSetIsHidden = useCallback(
    (key: Type, newValue: (isHidden: boolean) => boolean | boolean) => {
      const isHidden = list.includes(key);

      const newValueToStore = typeof newValue === 'function' ? newValue(isHidden) : newValue;

      if (newValueToStore && !list.includes(key)) {
        setHiddenLists({
          ...hiddenLists,
          [listName]: [...list, key],
        });
      } else if (!newValueToStore && list.includes(key)) {
        setHiddenLists({
          ...hiddenLists,
          [listName]: list.filter((item) => item !== key),
        });
      }
    },
    [list, hiddenLists, setHiddenLists, listName]
  );

  const isHidden = useCallback((key: Type) => list.includes(key), [list]);

  return [isHidden, handleSetIsHidden, list];
}

import { useLocalStorage } from '@chia/api-react';

export default function useHideObjectionableContent() {
  return useLocalStorage<boolean>('hideObjectionableContent', true);
}

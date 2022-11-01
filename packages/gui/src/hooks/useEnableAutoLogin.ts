import { useLocalStorage } from '@chia/api-react';

export default function useEnableAutoLogin() {
  return useLocalStorage<boolean>('enableAutoLogin', true);
}

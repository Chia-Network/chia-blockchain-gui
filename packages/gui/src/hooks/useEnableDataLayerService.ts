import { useLocalStorage } from '@chia/api-react';

export default function useEnableDataLayerService() {
  return useLocalStorage<boolean>('enableDataLayerService', false);
}

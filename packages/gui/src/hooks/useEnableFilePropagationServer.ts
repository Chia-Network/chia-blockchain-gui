import { useLocalStorage } from '@chia/api-react';

export default function useEnableFilePropagationServer() {
  return useLocalStorage<boolean>('enableFilePropagationServer', false);
}

import { useRef } from 'react';

export default function useFreshRef<Data>(data: Data) {
  const ref = useRef(data);

  ref.current = data;

  return ref;
}

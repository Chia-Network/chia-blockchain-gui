import { useRef, useMemo, useEffect } from 'react';

export default function Suspender() {
  const resolve = useRef<() => void>();
  const promise = useMemo(
    () =>
      new Promise<void>((res) => {
        resolve.current = res;
      }),
    []
  );

  useEffect(() => () => {
    resolve.current?.();
  });

  throw promise;
}

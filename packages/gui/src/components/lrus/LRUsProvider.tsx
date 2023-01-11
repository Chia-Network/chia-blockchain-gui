import LRU, { lruCreate } from '@chia-network/core';
import React, { ReactNode, createContext, useCallback, useMemo, useState } from 'react';

export interface LRUsContextData<K, V> {
  getLRU: (name: string) => LRU<K, V>;
}

export const LRUsContext = createContext<LRUsContextData<string, any> | undefined>(undefined);

export type LRUsProviderProps = {
  children?: ReactNode;
};

export default function LRUsProvider(props: LRUsProviderProps) {
  const { children } = props;

  const [LRUs, setLRUs] = useState<Record<string, LRU | undefined>>({});

  const getLRU = useCallback(
    (name: string) => {
      let lru = LRUs[name];
      if (!lru) {
        lru = lruCreate<string, any>();
        setLRUs((prev) => ({ ...prev, [name]: lru }));
      }
      return lru;
    },
    [LRUs]
  );
  const value = useMemo(() => ({ getLRU }), [getLRU]);

  return <LRUsContext.Provider value={value}>{children}</LRUsContext.Provider>;
}

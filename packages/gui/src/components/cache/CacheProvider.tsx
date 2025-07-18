import React, { useMemo, useState, useEffect, useCallback, type ReactNode } from 'react';

const { cacheAPI } = window;

import CacheContext from './CacheContext';

export type CacheProviderProps = {
  children?: ReactNode;
};

export default function CacheProvider(props: CacheProviderProps) {
  const { children } = props;

  const [maxCacheSize, setMaxCacheSize] = useState<number | undefined>(undefined);
  const [cacheDirectory, setCacheDirectory] = useState<string | undefined>(undefined);
  const [cacheSize, setCacheSize] = useState<number | undefined>(undefined);

  const updateCacheSize = useCallback(async () => {
    const size = await cacheAPI.getCacheSize();
    setCacheSize(size);
  }, []);

  const updateCacheDirectory = useCallback(async () => {
    const directory = await cacheAPI.getCacheDirectory();
    setCacheDirectory(directory);
  }, []);

  const updateMaxCacheSize = useCallback(async () => {
    const size = await cacheAPI.getMaxCacheSize();
    setMaxCacheSize(size);
  }, []);

  useEffect(() => {
    const unbindCacheDirectoryChanged = cacheAPI.subscribeToDirectoryChange(updateCacheDirectory);
    const unbindMaxCacheSizeChanged = cacheAPI.subscribeToMaxSizeChange(updateMaxCacheSize);
    const unbindSizeChanged = cacheAPI.subscribeToSizeChange(updateCacheSize);

    updateCacheSize();
    updateCacheDirectory();
    updateMaxCacheSize();

    return () => {
      unbindCacheDirectoryChanged();
      unbindMaxCacheSizeChanged();
      unbindSizeChanged();
    };
  }, [updateCacheSize, updateCacheDirectory, updateMaxCacheSize]);

  const context = useMemo(() => {
    const { getCacheDirectory, getCacheSize, getMaxCacheSize, ...rest } = cacheAPI;

    return {
      ...rest,
      cacheDirectory,
      cacheSize,
      maxCacheSize,
    };
  }, [cacheSize, cacheDirectory, maxCacheSize]);

  return <CacheContext.Provider value={context}>{children}</CacheContext.Provider>;
}

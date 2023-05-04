import { type IpcRenderer } from 'electron';

import React, { useMemo, useState, useEffect, useCallback, type ReactNode } from 'react';

import type CacheAPI from '../../@types/CacheAPI';
import CacheContext from './CacheContext';

export type CacheProviderProps = {
  children?: ReactNode;
};

export default function CacheProvider(props: CacheProviderProps) {
  const { children } = props;
  const { cacheApi, ipcRenderer } = window as unknown as {
    ipcRenderer: IpcRenderer;
    cacheApi: CacheAPI;
  };

  const [maxCacheSize, setMaxCacheSize] = useState<number | undefined>(undefined);
  const [cacheDirectory, setCacheDirectory] = useState<string | undefined>(undefined);
  const [cacheSize, setCacheSize] = useState<number | undefined>(undefined);

  const updateCacheSize = useCallback(async () => {
    const size = await cacheApi.getCacheSize();
    setCacheSize(size);
  }, [cacheApi]);

  const updateCacheDirectory = useCallback(async () => {
    const directory = await cacheApi.getCacheDirectory();
    setCacheDirectory(directory);
  }, [cacheApi]);

  const updateMaxCacheSize = useCallback(async () => {
    const size = await cacheApi.getMaxCacheSize();
    setMaxCacheSize(size);
  }, [cacheApi]);

  useEffect(() => {
    ipcRenderer.on('cache:cacheDirectoryChanged', updateCacheDirectory);
    ipcRenderer.on('cache:maxCacheSizeChanged', updateMaxCacheSize);
    ipcRenderer.on('cache:sizeChanged', updateCacheSize);

    updateCacheSize();
    updateCacheDirectory();
    updateMaxCacheSize();

    return () => {
      ipcRenderer.off('cache:cacheDirectoryChanged', updateCacheDirectory);
      ipcRenderer.off('cache:maxCacheSizeChanged', updateMaxCacheSize);
      ipcRenderer.off('cache:sizeChanged', updateCacheSize);
    };
  }, [ipcRenderer, updateCacheSize, updateCacheDirectory, updateMaxCacheSize]);

  const context = useMemo(() => {
    const { getCacheDirectory, getCacheSize, getMaxCacheSize, ...rest } = cacheApi;

    return {
      ...rest,
      cacheDirectory,
      cacheSize,
      maxCacheSize,
    };
  }, [cacheApi, cacheSize, cacheDirectory, maxCacheSize]);

  return <CacheContext.Provider value={context}>{children}</CacheContext.Provider>;
}

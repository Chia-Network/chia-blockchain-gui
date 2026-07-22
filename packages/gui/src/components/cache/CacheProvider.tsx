import { usePrefs } from '@chia-network/api-react';
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

  // The main process only reads these preferences at startup; changes made at
  // runtime live in CacheManager's memory, so they are persisted here in the
  // renderer where all other preferences are written (prefs.yaml is rewritten
  // from the renderer's snapshot on every preference save - a main process
  // write would be clobbered by the next renderer save).
  const [, setMaxCacheSizePref] = usePrefs<number | undefined>('maxCacheSize', undefined);
  const [, setCacheFolderPref] = usePrefs<string | undefined>('cacheFolder', undefined);

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

  const handleCacheDirectoryChanged = useCallback(async () => {
    const directory = await cacheAPI.getCacheDirectory();
    setCacheDirectory(directory);
    setCacheFolderPref(directory);
  }, [setCacheFolderPref]);

  const handleMaxCacheSizeChanged = useCallback(async () => {
    const size = await cacheAPI.getMaxCacheSize();
    setMaxCacheSize(size);
    setMaxCacheSizePref(size);
  }, [setMaxCacheSizePref]);

  useEffect(() => {
    const unbindCacheDirectoryChanged = cacheAPI.subscribeToDirectoryChange(handleCacheDirectoryChanged);
    const unbindMaxCacheSizeChanged = cacheAPI.subscribeToMaxSizeChange(handleMaxCacheSizeChanged);
    const unbindSizeChanged = cacheAPI.subscribeToSizeChange(updateCacheSize);

    updateCacheSize();
    updateCacheDirectory();
    updateMaxCacheSize();

    return () => {
      unbindCacheDirectoryChanged();
      unbindMaxCacheSizeChanged();
      unbindSizeChanged();
    };
  }, [
    updateCacheSize,
    updateCacheDirectory,
    updateMaxCacheSize,
    handleCacheDirectoryChanged,
    handleMaxCacheSizeChanged,
  ]);

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

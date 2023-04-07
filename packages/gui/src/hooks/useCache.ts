import { type IpcRenderer } from 'electron';

import { useMemo, useState, useEffect, useCallback } from 'react';

export default function useCache() {
  const { cacheApi, ipcRenderer } = window as unknown as {
    ipcRenderer: IpcRenderer;
    cacheApi: {
      getCacheSize: () => Promise<number>;
      clearCache: () => Promise<void>;
      getCacheDirectory: () => Promise<string>;
      setCacheDirectory: (newDirectory: string) => Promise<void>;
      setMaxCacheSize: (newSize: number) => Promise<void>;
      getMaxCacheSize: () => Promise<number>;
      get: (
        url: string,
        options?: { maxSize?: number; timeout?: number }
      ) => Promise<{ uri: string; headers: any; content: Buffer; checksum: string }>;
      invalidate: (url: string) => Promise<void>;
    };
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

  return useMemo(() => {
    const { getCacheDirectory, getCacheSize, getMaxCacheSize, ...rest } = cacheApi;

    return {
      ...rest,
      cacheDirectory,
      cacheSize,
      maxCacheSize,
      async getChecksum(url: string, options?: { maxSize?: number; timeout?: number }) {
        const { checksum } = await cacheApi.get(url, options);
        return checksum;
      },
      async getHeaders(url: string, options?: { maxSize?: number; timeout?: number }) {
        const { headers } = await cacheApi.get(url, options);
        return headers;
      },
      async getContent(url: string, options?: { maxSize?: number; timeout?: number }) {
        const { content } = await cacheApi.get(url, options);
        return content;
      },
      async getUri(url: string, options?: { maxSize?: number; timeout?: number }) {
        const { uri } = await cacheApi.get(url, options);
        return uri;
      },
    };
  }, [cacheApi, cacheSize, cacheDirectory, maxCacheSize]);
}

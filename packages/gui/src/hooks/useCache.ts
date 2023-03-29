import { useMemo } from 'react';

export default function useCache() {
  const { cacheApi } = window as unknown as {
    cacheApi: {
      getCacheSize: () => Promise<number>;
      clearCache: () => Promise<void>;
      changeCacheDirectory: (newDirectory: string) => Promise<void>;
      setMaxTotalSize: (newSize: number) => Promise<void>;
      get: (
        url: string,
        options?: { maxSize?: number; timeout?: number }
      ) => Promise<{ headers: any; content: Buffer; checksum: string }>;
      invalidate: (url: string) => Promise<void>;
    };
  };

  return useMemo(
    () => ({
      ...cacheApi,
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
    }),
    [cacheApi]
  );
}

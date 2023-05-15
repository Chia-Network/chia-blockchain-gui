type CacheAPI = {
  getCacheSize: () => Promise<number>;
  clearCache: () => Promise<void>;
  getCacheDirectory: () => Promise<string>;
  setCacheDirectory: (newDirectory: string) => Promise<void>;
  setMaxCacheSize: (newSize: number) => Promise<void>;
  getMaxCacheSize: () => Promise<number>;
  getContent: (url: string, options?: { maxSize?: number; timeout?: number }) => Promise<Buffer>;
  getHeaders: (url: string, options?: { maxSize?: number; timeout?: number }) => Promise<Object>;
  getURI: (url: string, options?: { maxSize?: number; timeout?: number }) => Promise<string>;
  getChecksum: (url: string, options?: { maxSize?: number; timeout?: number }) => Promise<string>;
  invalidate: (url: string) => Promise<void>;
};

export default CacheAPI;

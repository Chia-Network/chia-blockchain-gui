type CacheRequestOptions = {
  maxSize?: number;
  timeout?: number;
};

type CacheService = {
  // Cache management methods
  getCacheSize: () => Promise<number>;
  clearCache: () => Promise<void>;

  // Directory management
  getCacheDirectory: () => Promise<string>;
  setCacheDirectory: (directory: string) => Promise<void>;

  // Size management
  getMaxCacheSize: () => Promise<number>;
  setMaxCacheSize: (sizeInBytes: number) => Promise<void>;

  // Content operations
  getContent: (url: string, options?: CacheRequestOptions) => Promise<Buffer>;
  getHeaders: (url: string, options?: CacheRequestOptions) => Promise<Record<string, string>>;
  getChecksum: (url: string, options?: CacheRequestOptions) => Promise<string>;
  getURI: (url: string, options?: CacheRequestOptions) => Promise<string>;
  invalidate: (url: string) => Promise<void>;

  // Event subscriptions
  subscribeToDirectoryChange: (callback: (newDirectory: string) => void) => () => void;
  subscribeToMaxSizeChange: (callback: (newSize: number) => void) => () => void;
  subscribeToSizeChange: (callback: () => void) => () => void;
};

export default CacheService;

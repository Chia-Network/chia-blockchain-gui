import API from './API';

enum CacheAPI {
  // Cache management
  GET_CACHE_SIZE = `${API.CACHE}:getCacheSize`,
  CLEAR_CACHE = `${API.CACHE}:clearCache`,

  // Directory management
  GET_CACHE_DIRECTORY = `${API.CACHE}:getCacheDirectory`,
  SET_CACHE_DIRECTORY = `${API.CACHE}:setCacheDirectory`,

  // Size management
  GET_MAX_CACHE_SIZE = `${API.CACHE}:getMaxCacheSize`,
  SET_MAX_CACHE_SIZE = `${API.CACHE}:setMaxCacheSize`,

  // Content operations
  GET_CONTENT = `${API.CACHE}:getContent`,
  GET_HEADERS = `${API.CACHE}:getHeaders`,
  GET_CHECKSUM = `${API.CACHE}:getChecksum`,
  GET_URI = `${API.CACHE}:getUri`,
  INVALIDATE = `${API.CACHE}:invalidate`,

  // Event subscriptions
  ON_CACHE_DIRECTORY_CHANGED = `${API.CACHE}:onCacheDirectoryChanged`,
  ON_MAX_CACHE_SIZE_CHANGED = `${API.CACHE}:onMaxCacheSizeChanged`,
  ON_SIZE_CHANGED = `${API.CACHE}:onSizeChanged`,
}

export default CacheAPI;

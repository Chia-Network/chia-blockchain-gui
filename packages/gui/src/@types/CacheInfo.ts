import type CacheInfoBase from './CacheInfoBase';

type CacheInfo = {
  url: string;
  timestamp: number;
} & CacheInfoBase;

export default CacheInfo;

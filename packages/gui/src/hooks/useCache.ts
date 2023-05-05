import { useContext } from 'react';

import CacheContext from '../components/cache/CacheContext';

export default function useCache() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('Use of useCache outside of CacheProvider');
  }

  return context;
}

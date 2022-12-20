import React from 'react';

export default function useSyncCache() {
  const { ipcRenderer } = window as any;

  const [isSyncingCache, setSynced] = React.useState(true);
  async function syncCacheFiles() {
    const files = await ipcRenderer.invoke('getCacheFilenames');
    Object.keys({ ...localStorage }).forEach((key) => {
      if (
        key.indexOf('content-cache-') === 0 ||
        key.indexOf('thumb-cache-') === 0 ||
        key.indexOf('metadata-cache-') === 0
      ) {
        try {
          const metadata = JSON.parse(localStorage.getItem(key));
          if (metadata.binary && files.indexOf(metadata.binary) === -1) {
            localStorage.removeItem(key);
          }
          if (metadata.video && files.indexOf(metadata.video) === -1) {
            localStorage.removeItem(key);
          }
          if (metadata.image && files.indexOf(metadata.image) === -1) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Do nothing
        }
      }
    });
    setSynced(false);
  }

  React.useEffect(() => {
    syncCacheFiles();
  }, []);

  return {
    isSyncingCache,
  };
}

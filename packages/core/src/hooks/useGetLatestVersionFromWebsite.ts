import { useState, useEffect } from 'react';

export default function useGetLatestVersionFromWebsite(skipVersionExists: boolean) {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [downloadPath, setDownloadPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (skipVersionExists) {
      return;
    }
    const { ipcRenderer } = window as any;
    ipcRenderer.invoke('fetchHtmlContent', 'https://download.chia.net/latest/latest.json').then((obj: any) => {
      try {
        const { version, downloadPageUrl } = obj.data;
        setTimeout(() => {
          setLatestVersion(version);
          setDownloadPath(downloadPageUrl);
          setIsLoading(false);
        }, 1000); /* we need the delay, otherwise dialog will close too fast */
      } catch (e) {
        /* we don't need to handle error here, if we are unable to fetch version number
           from chia.net, we just ignore showing reminder dialog */
      }
    });
  }, [skipVersionExists]);

  return { latestVersion, isLoading, downloadUrl: `https://www.chia.net/${downloadPath}` };
}

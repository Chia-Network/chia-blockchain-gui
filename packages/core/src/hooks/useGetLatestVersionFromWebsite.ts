import { useState, useEffect } from 'react';

export default function useGetLatestVersionFromWebsite(skipVersionExists: boolean) {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (skipVersionExists) {
      return;
    }
    const { ipcRenderer } = window as any;
    ipcRenderer.invoke('fetchHtmlContent', 'https://chia.net/downloads/').then((obj: any) => {
      try {
        const domParser = new DOMParser();
        const doc = domParser.parseFromString(obj.data, 'text/html');
        const versionHtmlTexts = Array.from(doc.body.querySelectorAll('*')).filter((node: any) => {
          const noChildren = node.children.length === 0;
          const hasVersionString = ((node as any).innerText || '').indexOf('Version') > -1;
          return noChildren && hasVersionString;
        });
        const versionHtmlText = versionHtmlTexts[0];
        const version = (versionHtmlText as any).innerText.match(/Version\s*([\d.]+)/i)[1];
        setTimeout(() => {
          setLatestVersion(version);
          setIsLoading(false);
        }, 1000);
      } catch (e) {
        /* we don't need to handle error here, if we are unable to fetch and parse version number
           from chia.net/downloads, we just ignore showing reminder dialog */
      }
    });
  }, [skipVersionExists]);

  return { latestVersion, isLoading };
}

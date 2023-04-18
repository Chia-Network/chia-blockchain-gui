import { useState, useEffect } from 'react';

export default function useGetLatestVersionFromWebsite(skipVersionExists: boolean) {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [downloadPath, setDownloadPath] = useState<string | null>(null);
  const [releaseNotesPath, setReleaseNotesPath] = useState<string | null>(null);
  const [blogPath, setBlogPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (skipVersionExists) {
      return;
    }
    const { ipcRenderer } = window as any;
    ipcRenderer.invoke('fetchHtmlContent', 'https://download.chia.net/latest/latest.json').then((obj: any) => {
      try {
        const { version, downloadPageUrl, releaseNotesUrl, blogUrl } = obj.data;
        setTimeout(() => {
          setLatestVersion(version);
          setDownloadPath(downloadPageUrl);
          setReleaseNotesPath(releaseNotesUrl);
          setBlogPath(blogUrl);
          setIsLoading(false);
        }, 1000); /* we need the delay, otherwise dialog will close too fast */
      } catch (e) {
        /* we don't need to handle error here, if we are unable to fetch version number
           from chia.net, we just ignore showing reminder dialog */
      }
    });
  }, [skipVersionExists]);

  const downloadUrl = downloadPath ? new URL(downloadPath, 'https://www.chia.net/').toString() : undefined;
  const releaseNotesUrl = releaseNotesPath ? new URL(releaseNotesPath, 'https://www.chia.net/').toString() : undefined;
  const blogUrl = blogPath ? new URL(blogPath, 'https://www.chia.net/').toString() : undefined;

  return { latestVersion, isLoading, downloadUrl, releaseNotesUrl, blogUrl };
}

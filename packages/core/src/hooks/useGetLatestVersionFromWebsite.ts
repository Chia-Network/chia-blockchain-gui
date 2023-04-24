import { useLocalStorage } from '@chia-network/api-react';
import { useCallback, useState, useEffect } from 'react';

import compareAppVersions from '../utils/compareAppVersion';
import useAppVersion from './useAppVersion';

type UseGetLatestVersionFromWebsiteResult = {
  appVersion: string | undefined;
  latestVersion: string | null;
  downloadUrl: string | undefined;
  releaseNotesUrl: string | undefined;
  blogUrl: string | undefined;
  isLoading: boolean;
  newVersionAvailable: boolean;
  isVersionSkipped: boolean;
  skipVersions: string[] | undefined;
  addVersionToSkip: (version: string) => void;
};

export default function useGetLatestVersionFromWebsite(): UseGetLatestVersionFromWebsiteResult {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [downloadPath, setDownloadPath] = useState<string | null>(null);
  const [releaseNotesPath, setReleaseNotesPath] = useState<string | null>(null);
  const [blogPath, setBlogPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [latestVersionURL] = useLocalStorage<string>(
    'latestVersionURL',
    'https://download.chia.net/latest/latest.json'
  );
  const [skipVersions, setSkipVersions] = useLocalStorage<string[]>('skipVersions', []);
  const { version: appVersion } = useAppVersion();
  const versionComparisonResult = latestVersion ? compareAppVersions(appVersion, latestVersion) : 0;
  const newVersionAvailable = versionComparisonResult === -1;
  const isVersionSkipped = skipVersions?.includes(latestVersion ?? '') ?? false;

  const addVersionToSkip = useCallback(
    (version: string) => {
      setSkipVersions((prev) => [...(prev ?? []), version]);
    },
    [setSkipVersions]
  );

  useEffect(() => {
    const { ipcRenderer } = window as any;
    ipcRenderer.invoke('fetchHtmlContent', latestVersionURL).then((obj: any) => {
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
  }, [latestVersionURL]);

  const downloadUrl = downloadPath ? new URL(downloadPath, 'https://www.chia.net/').toString() : undefined;
  const releaseNotesUrl = releaseNotesPath ? new URL(releaseNotesPath, 'https://www.chia.net/').toString() : undefined;
  const blogUrl = blogPath ? new URL(blogPath, 'https://www.chia.net/').toString() : undefined;

  return {
    appVersion,
    latestVersion,
    newVersionAvailable,
    isVersionSkipped,
    skipVersions,
    addVersionToSkip,
    isLoading,
    downloadUrl,
    releaseNotesUrl,
    blogUrl,
  };
}

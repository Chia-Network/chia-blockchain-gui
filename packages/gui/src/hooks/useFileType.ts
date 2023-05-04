import { useEffect, useState, useCallback } from 'react';

import FileType from '../constants/FileType';
import getFileType from '../util/getFileType';
import useCache from './useCache';

export default function useFileType(uri?: string) {
  const { getHeaders } = useCache();
  const [type, setType] = useState<FileType>(FileType.UNKNOWN);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const process = useCallback(async () => {
    try {
      setIsLoading(true);
      setType(FileType.UNKNOWN);
      setError(undefined);

      if (!uri) {
        return;
      }

      const fileType = getFileType(uri);
      if (fileType !== FileType.UNKNOWN) {
        setType(fileType);
        return;
      }

      const headers = await getHeaders(uri);
      if (!headers?.['content-type']) {
        setType(FileType.UNKNOWN);
        return;
      }

      const contentType = headers['content-type'];
      if (contentType.startsWith('image/')) {
        setType(FileType.IMAGE);
        return;
      }

      if (contentType.startsWith('video/')) {
        setType(FileType.VIDEO);
        return;
      }

      if (contentType.startsWith('audio/')) {
        setType(FileType.AUDIO);
        return;
      }

      if (contentType.startsWith('model/')) {
        setType(FileType.MODEL);
        return;
      }

      setType(FileType.UNKNOWN);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [uri, getHeaders]);

  useEffect(() => {
    process();
  }, [process]);

  return { type, isLoading, error };
}

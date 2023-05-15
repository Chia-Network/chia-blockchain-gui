import debug from 'debug';
import { useCallback } from 'react';

import type Metadata from '../@types/Metadata';
import compareChecksums from '../util/compareChecksums';
import parseFileContent from '../util/parseFileContent';
import useCache from './useCache';

const log = debug('chia-gui:useFetchAndProcessMetadata');

export default function useFetchAndProcessMetadata() {
  const { getChecksum, getHeaders, getContent } = useCache();

  // immutable function
  const fetchAndProcessMetadata = useCallback(
    async (uri: string, hash: string | undefined) => {
      log(`Fetching metadata from ${uri}`);

      const checksum = await getChecksum(uri);

      log(`Comparing checksums ${checksum} and ${hash}`);
      if (hash && !compareChecksums(checksum, hash)) {
        throw new Error('Checksum mismatch');
      }

      const headers = await getHeaders(uri);
      const content = await getContent(uri);

      const metadataString = parseFileContent(content, headers);

      return JSON.parse(metadataString) as Metadata;
    },
    [getChecksum /* immutable */, getHeaders /* immutable */, getContent /* immutable */]
  );

  return fetchAndProcessMetadata;
}

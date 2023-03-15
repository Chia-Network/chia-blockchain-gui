export enum FileType {
  Binary = 'binary',
  Video = 'video',
  Image = 'image',
  Metadata = 'metadata',
}

export type RemoteFileContent = {
  uri: string;
  maxSize?: number;
  forceCache?: boolean;
  nftId?: string;
  type?: FileType;
  dataHash?: string;
  timeout?: number;
};

type FetchBinaryResponseType = {
  dataObject: any;
  statusCode: number;
  encoding: string;
  error: string;
  wasCached: boolean;
};

export default function getRemoteFileContent(props: RemoteFileContent): Promise<{
  data: string;
  encoding: string;
  wasCached: boolean;
  isValid: boolean;
}> {
  const { ipcRenderer } = window as any;
  const requestOptions = {
    url: props.uri,
    maxSize: props.maxSize,
    forceCache: props.forceCache,
    nftId: props.nftId,
    type: props.type,
    dataHash: props.dataHash,
  };

  let done: boolean = false;

  const failedToFetchContent: string = `Failed to fetch content from ${requestOptions.url}`;

  return new Promise((resolve, reject) => {
    if (props.timeout && !done) {
      setTimeout(() => {
        reject(failedToFetchContent);
        done = true;
      }, props.timeout);
    }
    ipcRenderer?.invoke('fetchBinaryContent', requestOptions).then((response: FetchBinaryResponseType) => {
      if (typeof response === 'object') {
        const { dataObject, statusCode, encoding, error, wasCached } = response;
        if (error) {
          reject(error);
        }

        if (statusCode !== 200) {
          reject(failedToFetchContent);
        }
        if (!done) {
          resolve({
            data: dataObject.content,
            isValid: dataObject.isValid,
            encoding,
            wasCached,
          });
          done = true;
        }
      } else {
        reject(new Error('Fetch binary content error'));
      }
    });
  });
}

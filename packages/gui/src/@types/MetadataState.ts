import type Metadata from './Metadata';

type MetadataState = {
  metadata: Metadata | undefined;
  error?: Error;
  isLoading: boolean;
};

export default MetadataState;

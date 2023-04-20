import type Metadata from './Metadata';

type MetadataOnDemand = {
  metadata?: Metadata;
  error?: Error;
  promise?: Promise<Metadata>;
};

export default MetadataOnDemand;

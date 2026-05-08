import type { PairGrants, PairMetadata, PairRecord } from './types';

// usedMojos always starts fresh — never inherit allowance usage from a prior pair.
export function buildNewPairRecord(input: {
  topic: string;
  mainnet: boolean;
  metadata: PairMetadata;
  fingerprints: number[];
  grants: PairGrants;
  commands: string[];
  bypass?: string[];
  now: number;
}): PairRecord {
  return {
    topic: input.topic,
    mainnet: input.mainnet,
    metadata: input.metadata,
    fingerprints: input.fingerprints,
    createdAt: input.now,
    updatedAt: input.now,
    grants: input.grants,
    usedMojos: '0',
    commands: input.commands,
    bypass: input.bypass ?? [],
  };
}

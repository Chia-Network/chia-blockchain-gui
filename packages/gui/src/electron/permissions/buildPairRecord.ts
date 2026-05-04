import type { PairGrants, PairMetadata, PairRecord } from './types';

// spentMojos always starts fresh — never inherit budget from a prior pair.
// bypass is whatever the user approved in the Pair dialog (typically empty
// at first connect, populated when they tick capability/per-command boxes).
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
    spentMojos: '0',
    commands: input.commands,
    bypass: input.bypass ?? [],
  };
}

import type { PairGrants, PairMetadata, PairRecord } from './types';

// spentMojos and bypass MUST start fresh — never inherit budget or silent
// approvals from a prior pair.
export function buildNewPairRecord(input: {
  topic: string;
  mainnet: boolean;
  metadata: PairMetadata;
  fingerprints: number[];
  grants: PairGrants;
  commands: string[];
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
    bypass: [],
  };
}

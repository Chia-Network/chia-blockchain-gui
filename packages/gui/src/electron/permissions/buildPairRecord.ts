import type { PairGrants, PairMetadata, PairRecord } from './types';

/**
 * Assemble a fresh `PairRecord` for `PAIR_REGISTER`. Pulled out of
 * `main.tsx`'s IPC handler so the field shape — which fields default,
 * which copy through, which initialize empty — can be pinned by a test
 * without standing up the full IPC + dialog runtime.
 *
 * Critical invariants this enforces by construction:
 *   - `spentMojos` always starts at `'0'` (string for BigNumber-safe
 *     serialization). Reusing an old non-zero string here would inherit
 *     budget from a prior pair.
 *   - `bypass` always starts at `[]`. New pairs cannot inherit silent
 *     approvals; the user has to opt in via the Confirm dialog later.
 *   - `commands` is the caller-provided filtered list (intersection of
 *     dapp-requested ∩ registry-allowed); no implicit expansion.
 *   - `createdAt === updatedAt === now`. No drift between the two on
 *     fresh records.
 */
export function buildNewPairRecord(input: {
  topic: string;
  mainnet: boolean;
  metadata: PairMetadata;
  fingerprints: number[];
  grants: PairGrants;
  /** Filtered subset of dapp-requested WC methods (wire form). */
  commands: string[];
  /** UNIX millis stamped into both `createdAt` and `updatedAt`. */
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

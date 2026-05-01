import { fromBech32m } from '@chia-network/api';

import sendCommand from '../utils/sendCommand';

// Map fingerprint → set of lowercase, no-prefix hex puzzle hashes owned by
// that wallet. Populated when a pair is registered/edited and refreshed
// best-effort. Used by the spend-budget logic to filter coin_spends to
// inputs the user actually owns.
const cache = new Map<number, Set<string>>();

export function normalizePuzzleHash(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.startsWith('0x') ? value.slice(2) : value;
  return trimmed.toLowerCase();
}

export function getOwnedPuzzleHashes(fingerprints: number[]): Set<string> {
  const all = new Set<string>();
  for (const fp of fingerprints) {
    const hashes = cache.get(fp);
    if (hashes) hashes.forEach((h) => all.add(h));
  }
  return all;
}

type WalletAddress = { address?: string; hd_path?: string };
type GetWalletAddressesResponse = {
  wallet_addresses?: Record<string, WalletAddress[]>;
};

/**
 * Fetch and cache the user's owned puzzle hashes for one fingerprint, by
 * asking `daemon.get_wallet_addresses` for the first `count` derived
 * addresses and bech32-decoding each into a puzzle hash. Idempotent —
 * subsequent calls overwrite the cached set, so this can be used both to
 * initially populate and to refresh.
 */
export async function refreshPuzzleHashesForFingerprint(
  fingerprint: number,
  count = 1000,
): Promise<void> {
  try {
    const response = await sendCommand<GetWalletAddressesResponse>('get_wallet_addresses', 'daemon', {
      fingerprints: [fingerprint],
      index: 0,
      count,
      non_observer_derivation: false,
    });

    const entries = response?.wallet_addresses?.[String(fingerprint)] ?? [];
    const hashes = new Set<string>();
    for (const entry of entries) {
      const address = entry?.address;
      if (typeof address !== 'string' || address.length === 0) continue;
      try {
        const hex = fromBech32m(address);
        const normalized = normalizePuzzleHash(hex);
        if (normalized) hashes.add(normalized);
      } catch {
        // Skip malformed addresses — they shouldn't appear in practice.
      }
    }
    cache.set(fingerprint, hashes);
  } catch (err) {
    // Best effort: leave any prior cache in place. The push-transactions
    // resolver returns undefined when no cache is available, which falls
    // back to prompting the user — the safe direction.
    console.warn(`Failed to refresh puzzle hashes for fingerprint ${fingerprint}:`, err);
  }
}

export async function refreshPuzzleHashesForFingerprints(fingerprints: number[]): Promise<void> {
  await Promise.all(fingerprints.map((fp) => refreshPuzzleHashesForFingerprint(fp)));
}

export function clearPuzzleHashCache(): void {
  cache.clear();
}

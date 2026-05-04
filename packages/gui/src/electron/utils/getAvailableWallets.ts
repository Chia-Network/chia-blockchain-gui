import type { PairWalletOption } from '../dialogs/Pair/Pair';

import sendCommand from './sendCommand';

// Sourced from the daemon (not the renderer) so a compromised renderer
// can't fabricate the wallet list or claim the wrong active key.
export default async function getAvailableWallets(): Promise<{
  availableWallets: PairWalletOption[];
  defaultFingerprints: number[];
}> {
  const { keys = [] } = await sendCommand<{ keys?: { fingerprint: number; label?: string }[] }>('get_keys', 'daemon');
  const availableWallets: PairWalletOption[] = keys.map((k) => ({
    fingerprint: k.fingerprint,
    name: k.label || undefined,
  }));

  // Default-selection only — tolerate failure; the dialog still opens.
  let loggedInFingerprint: number | undefined;
  try {
    const { fingerprint } = await sendCommand<{ fingerprint?: number }>('get_logged_in_fingerprint', 'chia_wallet');
    loggedInFingerprint = typeof fingerprint === 'number' ? fingerprint : undefined;
  } catch (err) {
    console.warn('Failed to fetch logged-in fingerprint for pair dialog default', err);
  }

  const defaultFingerprints =
    loggedInFingerprint !== undefined && availableWallets.some((w) => w.fingerprint === loggedInFingerprint)
      ? [loggedInFingerprint]
      : [];

  return { availableWallets, defaultFingerprints };
}

import { type BrowserWindow } from 'electron';

import { getKeys } from '../api/getKeys';
import { getLoggedInFingerprint } from '../api/getLoggedInFingerprint';
import Pair, { getTitle } from '../dialogs/Pair/Pair';

import openReactDialog from './openReactDialog';
import type { PairMetadata, PairRecord } from './pairSchemas';

export async function openPairDialog(
  mainWindow: BrowserWindow,
  metadata: PairMetadata,
  commands: string[], // dapp commands requested by the dapp
  pair?: PairRecord,
): Promise<{ fingerprint: number; bypass: string[] } | undefined> {
  const isEdit = !!pair;
  const title = getTitle(isEdit);
  const [keys, currentFingerprint] = await Promise.all([getKeys(), getLoggedInFingerprint()]);

  const result = await openReactDialog<
    {
      allowPair: boolean;
      fingerprint?: string;
      bypass?: string[];
    },
    React.ComponentProps<typeof Pair>
  >(
    mainWindow,
    Pair,
    {
      metadata,
      commands,

      keys,
      currentFingerprint,

      pair,
    },
    {
      title,
      width: 640,
      height: 600,
    },
  );

  if (!result || result.allowPair !== true) {
    return undefined;
  }

  const { fingerprint: fingerprintValue, bypass } = result;
  const fingerprint =
    pair?.fingerprint ?? (fingerprintValue === undefined ? undefined : Number.parseInt(fingerprintValue, 10));

  if (!fingerprint) {
    throw new Error('fingerprint is required');
  }

  return {
    bypass: bypass ?? [],
    fingerprint,
  };
}

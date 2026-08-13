import { WcError, WcErrorCode } from '../../@types/WcError';
import { getLoggedInFingerprint } from '../api/getLoggedInFingerprint';
import { isMainnet } from '../api/isMainnet';

import type { PairRecord } from './pairSchemas';
import { findPair } from './pairStore';

export type DispatchPairRequestContext = {
  pair: PairRecord;
  fingerprint: number;
};

// verify if the pair can execute the command
export async function dispatchPairRequest<T>(
  topic: string,
  command: string,
  params: Record<string, unknown>,
  process: (context: DispatchPairRequestContext) => Promise<T>,
  confirm: () => Promise<boolean>,
): Promise<T> {
  const [loggedInFingerprint, isMainnetValue] = await Promise.all([getLoggedInFingerprint(), isMainnet()]);

  const pair = findPair(topic);
  if (!pair) {
    throw new WcError(`Pair not found`, WcErrorCode.USER_REJECTED);
  }

  // verify if the command is allowed for this pair
  if (!pair.commands.includes(command)) {
    throw new WcError(`Command not allowed for this pair.`, WcErrorCode.UNAUTHORIZED_METHOD);
  }

  const { fingerprint } = params;

  // verify if the network is the same as the pair's network
  if (isMainnetValue !== pair.mainnet) {
    throw new WcError(`Network mismatch`, WcErrorCode.UNSUPPORTED_CHAINS);
  }

  // verify if the requested fingerprint is allowed for this pair
  const requestedFingerprint = fingerprint ?? loggedInFingerprint;
  if (typeof requestedFingerprint !== 'number' || !requestedFingerprint || requestedFingerprint !== pair.fingerprint) {
    throw new WcError(`Fingerprint not allowed for this command`, WcErrorCode.UNAUTHORIZED_METHOD);
  }

  const context = {
    pair,
    fingerprint: requestedFingerprint,
  };

  // Dapps may not switch the active key for an existing pair.
  if (fingerprint !== undefined && fingerprint !== loggedInFingerprint) {
    throw new WcError(`Fingerprint not allowed for this command`, WcErrorCode.UNAUTHORIZED_METHOD);
  }

  // if command is bypassed return true
  if (pair.bypass.includes(command)) {
    return process(context);
  }

  const isAllowed = await confirm();
  if (isAllowed === true) {
    return process(context);
  }

  throw new WcError(`Command not allowed for this pair.`, WcErrorCode.UNAUTHORIZED_METHOD);
}

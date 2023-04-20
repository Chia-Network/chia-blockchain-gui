import { toBech32m, fromBech32m } from '@chia-network/api';

import removeHexPrefix from './removeHexPrefix';

export function didToDIDId(did: string): string {
  return toBech32m(removeHexPrefix(did), 'did:chia:');
}

export function didFromDIDId(didId: string): string | undefined {
  let decoded: string | undefined;

  try {
    decoded = fromBech32m(didId);
  } catch (e) {
    return undefined;
  }

  return decoded;
}

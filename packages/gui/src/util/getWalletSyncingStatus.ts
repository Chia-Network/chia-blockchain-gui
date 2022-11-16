import SyncingStatus from '../constants/SyncingStatus';
import type { IncomingState } from '../modules/incoming';

export default function getWalletSyncingStatus(walletState: IncomingState) {
  const {
    status: { syncing, synced },
  } = walletState;

  if (syncing) {
    return SyncingStatus.SYNCING;
  }
  if (synced) {
    return SyncingStatus.SYNCED;
  }

  return SyncingStatus.NOT_SYNCED;
}

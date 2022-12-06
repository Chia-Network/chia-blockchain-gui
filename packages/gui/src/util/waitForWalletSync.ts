import api, { store } from '@chia-network/api-react';
import { getWalletSyncingStatus } from '@chia-network/wallets';

import SyncingStatus from '../constants/SyncingStatus';

const HOUR = 1000 * 60 * 60;

export default async function waitForWalletSync(maxWait = HOUR): Promise<void> {
  const startTime = Date.now();
  await new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const resultPromise = store.dispatch(api.endpoints.getSyncStatus.initiate());
      const { data } = await resultPromise;
      const walletState = getWalletSyncingStatus(data);

      resultPromise.unsubscribe();

      if (walletState === SyncingStatus.SYNCED) {
        clearInterval(interval);
        resolve();
      }

      if (Date.now() - startTime > maxWait) {
        clearInterval(interval);
        reject(new Error('Timed out waiting for wallet sync'));
      }
    }, 1000);
  });
}

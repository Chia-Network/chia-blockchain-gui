import { sendCommand } from './sendCommand';

export async function getLoggedInFingerprint(): Promise<number | undefined> {
  const { fingerprint } = await sendCommand<{ fingerprint?: number }>('get_logged_in_fingerprint', 'chia_wallet');
  return typeof fingerprint === 'number' ? fingerprint : undefined;
}

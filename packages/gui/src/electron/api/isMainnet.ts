import { getNetworkInfo } from './getNetworkInfo';

export async function isMainnet(): Promise<boolean> {
  const networkInfo = await getNetworkInfo();
  if (!networkInfo || !networkInfo.networkPrefix) {
    throw new Error('Unable to determine network prefix');
  }

  return networkInfo.networkPrefix.toUpperCase() === 'XCH';
}

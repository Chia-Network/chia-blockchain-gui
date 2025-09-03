import type { PoolInfo } from '@chia-network/api';
import { toCamelCase } from '@chia-network/api';

export default async function getPoolInfo(poolUrl: string): Promise<PoolInfo> {
  const data = await window.appAPI.fetchPoolInfo(poolUrl);
  return toCamelCase(data) as PoolInfo;
}

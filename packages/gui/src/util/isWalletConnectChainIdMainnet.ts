import { WcError, WcErrorCode } from '../@types/WcError';

export function isWalletConnectChainIdMainnet(chainId: string): boolean {
  if (chainId === 'chia:mainnet') {
    return true;
  }

  if (chainId === 'chia:testnet') {
    return false;
  }

  throw new WcError('Network not supported', WcErrorCode.UNSUPPORTED_CHAINS);
}

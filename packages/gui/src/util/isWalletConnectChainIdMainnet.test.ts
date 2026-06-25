import { WcErrorCode } from '../@types/WcError';

import { isWalletConnectChainIdMainnet } from './isWalletConnectChainIdMainnet';

describe('isWalletConnectChainIdMainnet', () => {
  it('accepts the exact mainnet chain id', () => {
    expect(isWalletConnectChainIdMainnet('chia:mainnet')).toBe(true);
  });

  it('accepts the exact testnet chain id', () => {
    expect(isWalletConnectChainIdMainnet('chia:testnet')).toBe(false);
  });

  it('rejects malformed or unsupported chia chain ids instead of treating them as testnet', () => {
    for (const chainId of ['chia', 'chia:', 'chia:devnet', 'chia:testnet:extra', 'chia:mainnet:extra']) {
      expect(() => isWalletConnectChainIdMainnet(chainId)).toThrow('Network not supported');
    }
  });

  it('rejects non-chia chain ids with the WalletConnect unsupported chains code', () => {
    try {
      isWalletConnectChainIdMainnet('ethereum:mainnet');
      throw new Error('Expected isWalletConnectChainIdMainnet to throw');
    } catch (error) {
      expect(error).toMatchObject({
        name: 'WcError',
        message: 'Network not supported',
        code: WcErrorCode.UNSUPPORTED_CHAINS,
      });
    }
  });
});

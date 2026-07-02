import { Commands } from './Commands';

describe('Commands', () => {
  describe('chia_getWalletBalance transform', () => {
    it('returns negative pending balance without reparsing it as non-negative mojos', () => {
      const transform = Commands['chia_wallet.get_wallet_balance'].dapp?.find(
        ({ command }) => command === 'chia_getWalletBalance',
      )?.transform;

      expect(transform).toBeDefined();
      expect(
        transform?.({
          wallet_balance: {
            confirmed_wallet_balance: 200,
            unconfirmed_wallet_balance: 150,
            asset_id: '0xabc',
          },
        }),
      ).toMatchObject({
        confirmed_wallet_balance: 200,
        unconfirmed_wallet_balance: 150,
        asset_id: 'abc',
        pending_balance: -50n,
        pending_total_balance: 150n,
      });
    });
  });

  describe('chia_getFullNodePeerCount transform', () => {
    it('unwraps the daemon response to the peer count', () => {
      const transform = Commands['chia_wallet.get_full_node_peer_count'].dapp?.find(
        ({ command }) => command === 'chia_getFullNodePeerCount',
      )?.transform;

      expect(transform).toBeDefined();
      expect(transform?.({ peer_count: 8, success: true })).toBe(8);
    });
  });
});

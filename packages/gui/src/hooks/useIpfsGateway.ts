import { usePrefs } from '@chia-network/api-react';

// When enabled, NFT resources published with ipfs:// URIs are fetched through
// an HTTPS gateway (ipfs.io unless useIpfsGatewayUrl says otherwise); the
// requested URL then differs from the URI
// recorded on chain, which is why this is a user-selectable opt-in (off by
// default — ipfs:// resources are simply not fetched). Downloaded content is
// still verified against the NFT's on-chain hash either way. The main process
// reads the persisted copy of this preference at every network call site
// (electron/utils/ipfsGateway.ts); keep the key in sync with
// NFT_IPFS_GATEWAY_PREF there.
export default function useIpfsGateway() {
  return usePrefs<boolean>('nftIpfsGateway', false);
}

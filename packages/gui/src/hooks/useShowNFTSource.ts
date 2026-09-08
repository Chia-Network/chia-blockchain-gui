import { usePrefs } from '@chia-network/api-react';

// When enabled, every NFT card carries a label saying where the file it
// shows came from: IPFS content or not, and — for IPFS content — whether the
// configured gateway produced it or the host in the file's own address did
// (NFTSourceStatus). Off by default: it is a diagnostic for users who run or
// choose their own gateway, and one more chip over every tile otherwise.
export default function useShowNFTSource() {
  return usePrefs<boolean>('nftShowSource', false);
}

import { usePrefs } from '@chia-network/api-react';

// When enabled, transaction confirmation dialogs may load an NFT preview
// directly from its source URL when the image is too large to verify against
// its on-chain hash. Off by default — unverifiable previews are not shown.
// The main process reads the persisted copy of this preference when resolving
// previews (electron/utils/allowUnverifiedNftPreviews.ts); keep the key in
// sync with NFT_ALLOW_UNVERIFIED_PREVIEWS_PREF there.
export default function useAllowUnverifiedNFTPreviews() {
  return usePrefs<boolean>('nftAllowUnverifiedPreviews', false);
}

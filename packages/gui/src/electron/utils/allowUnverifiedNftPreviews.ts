import { readPrefs } from '../prefs';

// Preference key shared with the renderer's useAllowUnverifiedNFTPreviews hook.
// The renderer persists it through PreferencesAPI.SAVE into prefs.yaml, which
// is the copy consulted here in the main process.
export const NFT_ALLOW_UNVERIFIED_PREVIEWS_PREF = 'nftAllowUnverifiedPreviews';

// Whether confirmation-dialog previews may fall back to loading an NFT image
// directly from its source URL when the image is too large to hash-verify.
// Fails closed: an unreadable preferences store (e.g. before userData is
// initialized) means no unverified content is shown.
export default function allowUnverifiedNftPreviews(): boolean {
  try {
    return readPrefs()[NFT_ALLOW_UNVERIFIED_PREVIEWS_PREF] === true;
  } catch {
    return false;
  }
}

import FileType from '../../constants/FileType';
import getFileType from '../../util/getFileType';
import { isIpfsUrl } from '../../util/ipfs';
import { nftGetImageDataUrl, nftGetMetadata } from '../api/nftGetMetadata';
import { ipfsGatewayEnabled } from '../utils/ipfsGateway';
import isValidURL from '../utils/isValidURL';

const NFT_PREVIEW_RESOLUTION_BUDGET_MS = 20_000;
export const MAX_NFT_PREVIEW_URI_ATTEMPTS = 8;

// Count inspected entries, not just accepted URLs: filtering a whole minter-
// authored list before slicing still blocks the main process. Preserve the
// existing 1000-disabled-IPFS-prefix case, but deliberately omit previews
// beyond this prefix rather than doing unbounded work before showing a dialog.
export const MAX_NFT_PREVIEW_URI_INSPECTIONS = 2048;
export const MAX_NFT_PREVIEW_URI_LENGTH = 8192;

function fetchableUris(uris: unknown, ipfsFetchable: boolean): string[] {
  if (!Array.isArray(uris)) {
    return [];
  }

  const result: string[] = [];
  const inspectedLength = Math.min(uris.length, MAX_NFT_PREVIEW_URI_INSPECTIONS);
  for (let index = 0; index < inspectedLength; index += 1) {
    const uri = uris[index];
    // Bound string work before parsing, and skip disabled IPFS before the
    // structural validator translates it through a gateway.
    if (
      typeof uri === 'string' &&
      uri.length <= MAX_NFT_PREVIEW_URI_LENGTH &&
      (ipfsFetchable || !isIpfsUrl(uri)) &&
      isValidURL(uri)
    ) {
      result.push(uri);
    }
  }
  return result;
}

async function resolveVerifiedImage(
  uris: string[],
  expectedHash: string | undefined,
  deadline: number,
): Promise<string | undefined> {
  if (!expectedHash) {
    return undefined;
  }
  for (const uri of uris.slice(0, MAX_NFT_PREVIEW_URI_ATTEMPTS)) {
    const timeLeft = deadline - Date.now();
    if (timeLeft <= 0) {
      return undefined;
    }
    // eslint-disable-next-line no-await-in-loop -- URIs are ordered fallbacks.
    const dataUrl = await nftGetImageDataUrl(uri, expectedHash, timeLeft);
    if (dataUrl) {
      return dataUrl;
    }
  }
  return undefined;
}

/** Return hash-checked image bytes, never a second unauthenticated fetch. */
export async function resolveNftPreviewUrl(
  dataUris: string[],
  dataHash: string | undefined,
  metadataUris: string[],
  metadataHash: string | undefined,
): Promise<string | undefined> {
  // Neither a URI scan nor a synchronous preferences read can help when
  // there is no hash against which an image or its metadata could verify.
  if (!dataHash && !metadataHash) {
    return undefined;
  }

  const deadline = Date.now() + NFT_PREVIEW_RESOLUTION_BUDGET_MS;
  const ipfsFetchable = ipfsGatewayEnabled();
  const validDataUris = dataHash ? fetchableUris(dataUris, ipfsFetchable) : [];
  const imageDataUrl = await resolveVerifiedImage(
    validDataUris.filter((uri) => getFileType(uri) === FileType.IMAGE),
    dataHash,
    deadline,
  );
  if (imageDataUrl) {
    return imageDataUrl;
  }

  if (metadataHash) {
    for (const metadataUri of fetchableUris(metadataUris, ipfsFetchable).slice(0, MAX_NFT_PREVIEW_URI_ATTEMPTS)) {
      const timeLeft = deadline - Date.now();
      if (timeLeft <= 0) {
        break;
      }
      // eslint-disable-next-line no-await-in-loop -- URIs are ordered fallbacks.
      const metadata = await nftGetMetadata(metadataUri, metadataHash, timeLeft);
      if (metadata?.preview_image_hash) {
        // eslint-disable-next-line no-await-in-loop -- Resolve each metadata fallback in order.
        const previewDataUrl = await resolveVerifiedImage(
          fetchableUris(metadata.preview_image_uris, ipfsFetchable),
          metadata.preview_image_hash,
          deadline,
        );
        if (previewDataUrl) {
          return previewDataUrl;
        }
      }
    }
  }

  // An extensionless URI may be an image; the verified response MIME type
  // decides. Known non-image data types keep their placeholder.
  return resolveVerifiedImage(
    validDataUris.filter((uri) => getFileType(uri) === FileType.UNKNOWN),
    dataHash,
    deadline,
  );
}

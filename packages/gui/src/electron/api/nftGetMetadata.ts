import crypto from 'node:crypto';

import type Headers from '../../@types/Headers';
import compareChecksums from '../../util/compareChecksums';
import { isIpfsUrl } from '../../util/ipfs';
import allowUnverifiedNftPreviews from '../utils/allowUnverifiedNftPreviews';
import fetchBuffer, { MaxSizeExceededError } from '../utils/fetchBuffer';
import maybeIpfsToGatewayUrl from '../utils/ipfsGateway';

const METADATA_TIMEOUT = 10_000;
const METADATA_MAX_SIZE = 5 * 1024 * 1024;
const IMAGE_TIMEOUT = 10_000;
const IMAGE_MAX_SIZE = 10 * 1024 * 1024;

export type NftMetadata = Record<string, unknown> & {
  preview_image_uris?: string[];
  preview_image_hash?: string;
  preview_video_uris?: string[];
  preview_video_hash?: string;
};

function checksum(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function getImageContentType(headers: Headers): string | undefined {
  const contentTypeHeader = headers['content-type'];
  const rawContentType = Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader;
  const contentType = rawContentType?.split(';', 1)[0].trim().toLowerCase();
  if (!contentType || !/^image\/[\w.+-]+$/.test(contentType)) {
    return undefined;
  }

  return contentType;
}

function hasExpectedChecksum(data: Buffer, expectedHash: string): boolean {
  return compareChecksums(checksum(data), expectedHash);
}

export async function nftGetMetadata(
  metadataUri: string,
  expectedHash: string | undefined,
  timeoutBudget: number = Number.POSITIVE_INFINITY,
): Promise<NftMetadata | undefined> {
  if (!expectedHash || timeoutBudget <= 0) {
    return undefined;
  }

  try {
    const { data } = await fetchBuffer(metadataUri, {
      headers: {
        Accept: 'application/json',
      },
      timeout: Math.min(METADATA_TIMEOUT, timeoutBudget),
      maxSize: METADATA_MAX_SIZE,
    });

    if (!hasExpectedChecksum(data, expectedHash)) {
      return undefined;
    }

    const metadata: unknown = JSON.parse(data.toString('utf8'));
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return undefined;
    }

    return metadata as NftMetadata;
  } catch {
    // metadata is best effort — the confirmation dialog renders without it
    return undefined;
  }
}

export async function nftGetImageDataUrl(
  imageUri: string,
  expectedHash: string | undefined,
  timeoutBudget: number = Number.POSITIVE_INFINITY,
): Promise<string | undefined> {
  if (!expectedHash || timeoutBudget <= 0) {
    return undefined;
  }

  try {
    const { data, headers } = await fetchBuffer(imageUri, {
      headers: {
        Accept: 'image/*',
      },
      timeout: Math.min(IMAGE_TIMEOUT, timeoutBudget),
      maxSize: IMAGE_MAX_SIZE,
    });

    if (!hasExpectedChecksum(data, expectedHash)) {
      return undefined;
    }

    const contentType = getImageContentType(headers);
    if (!contentType) {
      return undefined;
    }

    return `data:${contentType};base64,${data.toString('base64')}`;
  } catch (error) {
    // An image too large to inline cannot be hash-verified without unbounded
    // buffering. When the user has opted in, fall back to the direct URL — the
    // dialog CSP still allows https: images, matching the pre-verification
    // behavior for these files. Off by default: the response's size and type
    // claims are attacker-controlled, so the fallback can be triggered
    // deliberately to place unverified content in a confirmation dialog.
    // The CSP does not allow the ipfs: scheme either, so ipfs URIs fall back
    // to their gateway form, and only when the user has also enabled the
    // gateway — otherwise they get no preview rather than a CSP-blocked URL.
    // The same goes for a plain-http local gateway: the dialog can only
    // embed https: images.
    if (error instanceof MaxSizeExceededError && getImageContentType(error.headers) && allowUnverifiedNftPreviews()) {
      const directUrl = maybeIpfsToGatewayUrl(imageUri);
      return isIpfsUrl(directUrl) || !directUrl.startsWith('https://') ? undefined : directUrl;
    }

    // image previews are best effort — the confirmation dialog has a fallback
    return undefined;
  }
}

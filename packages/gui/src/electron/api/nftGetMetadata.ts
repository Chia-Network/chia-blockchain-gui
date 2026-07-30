import crypto from 'node:crypto';

import compareChecksums from '../../util/compareChecksums';
import fetchBuffer from '../utils/fetchBuffer';

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
  return crypto.createHash('sha256').update(data.toString('latin1'), 'latin1').digest('hex');
}

function hasExpectedChecksum(data: Buffer, expectedHash: string): boolean {
  return compareChecksums(checksum(data), expectedHash);
}

export async function nftGetMetadata(
  metadataUri: string,
  expectedHash: string | undefined,
): Promise<NftMetadata | undefined> {
  if (!expectedHash) {
    return undefined;
  }

  try {
    const { data } = await fetchBuffer(metadataUri, {
      headers: {
        Accept: 'application/json',
      },
      timeout: METADATA_TIMEOUT,
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
): Promise<string | undefined> {
  if (!expectedHash) {
    return undefined;
  }

  try {
    const { data, headers } = await fetchBuffer(imageUri, {
      headers: {
        Accept: 'image/*',
      },
      timeout: IMAGE_TIMEOUT,
      maxSize: IMAGE_MAX_SIZE,
    });

    if (!hasExpectedChecksum(data, expectedHash)) {
      return undefined;
    }

    const contentTypeHeader = headers['content-type'];
    const rawContentType = Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader;
    const contentType = rawContentType?.split(';', 1)[0].trim().toLowerCase();
    if (!contentType || !/^image\/[\w.+-]+$/.test(contentType)) {
      return undefined;
    }

    return `data:${contentType};base64,${data.toString('base64')}`;
  } catch {
    // image previews are best effort — the confirmation dialog has a fallback
    return undefined;
  }
}

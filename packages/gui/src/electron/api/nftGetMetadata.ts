import fetchJSON from '../utils/fetchJSON';

const METADATA_TIMEOUT = 10_000;
const METADATA_MAX_SIZE = 5 * 1024 * 1024;

export type NftMetadata = Record<string, unknown> & {
  preview_image_uris?: string[];
  preview_video_uris?: string[];
};

export async function nftGetMetadata(metadataUri: string): Promise<NftMetadata | undefined> {
  try {
    return await fetchJSON<NftMetadata>(metadataUri, {
      timeout: METADATA_TIMEOUT,
      maxSize: METADATA_MAX_SIZE,
    });
  } catch {
    // metadata is best effort — the confirmation dialog renders without it
    return undefined;
  }
}

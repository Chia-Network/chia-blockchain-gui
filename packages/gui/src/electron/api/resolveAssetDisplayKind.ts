import { catAssetIdToName } from './catAssetIdToName';
import { nftGetInfo } from './nftGetInfo';

export type ResolvedAssetDisplayKind = 'cat' | 'nft';

function normalizeAssetId(assetId: string): string {
  return (assetId.startsWith('0x') ? assetId.slice(2) : assetId).toLowerCase();
}

export default async function resolveAssetDisplayKind(assetId: string): Promise<ResolvedAssetDisplayKind | undefined> {
  const normalizedAssetId = normalizeAssetId(assetId);

  try {
    const nftInfo = await nftGetInfo(normalizedAssetId);
    const launcherId = nftInfo.nft_info?.launcher_id;

    if (launcherId && normalizeAssetId(launcherId) === normalizedAssetId) {
      return 'nft';
    }
  } catch {
    // The wallet does not have indexed NFT data for this launcher ID.
  }

  try {
    const catInfo = await catAssetIdToName(normalizedAssetId);

    if (catInfo.wallet_id != null || catInfo.name != null) {
      return 'cat';
    }
  } catch {
    // The asset is not a CAT known to the local wallet.
  }

  return undefined;
}
